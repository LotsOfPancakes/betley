// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BetleyNativeV2
 * @dev Multi-token pari-mutuel betting contract with optional fee system
 *      Fees are only applied when creator resolves bets properly
 *      Fees are calculated from losing pool only
 */
contract BetleyNativeV2 is ReentrancyGuard, Ownable {
    struct Bet {
        string name;
        string[] options;
        address creator;
        uint256 endTime;
        uint256 resolutionDeadline;
        bool resolved;
        uint8 winningOption;
        address token; // address(0) for native tokens, contract address for ERC20s
        mapping(uint8 => uint256) totalAmountPerOption;
        mapping(address => mapping(uint8 => uint256)) userBets;
        mapping(address => bool) hasClaimed;
    }
    
    mapping(uint256 => Bet) public bets;
    uint256 public betCounter;
    
    // ========== FEE SYSTEM PARAMETERS ==========
    bool public feeCreator = false;           // Toggle creator fees
    bool public feePlatform = false;          // Toggle platform fees
    uint256 public feeCreatorAmount = 200;    // 2% (basis points)
    uint256 public feePlatformAmount = 100;   // 1% (basis points)
    
    // Safety Limits
    uint256 public constant MAX_CREATOR_FEE = 300;  // 3% maximum
    uint256 public constant MAX_PLATFORM_FEE = 100; // 1% maximum
    
    // Fee Recipients and Accumulation
    address public platformFeeRecipient;     // Admin-updatable
    
    // Platform fee accumulation: recipient → token → amount
    mapping(address => mapping(address => uint256)) public pendingPlatformFees;
    
    // Events
    event BetCreated(uint256 indexed betId, address indexed creator, string name, address token);
    event BetPlaced(uint256 indexed betId, address indexed user, uint8 option, uint256 amount);
    event BetResolved(uint256 indexed betId, uint8 winningOption);
    event WinningsClaimed(uint256 indexed betId, address indexed user, uint256 amount);
    event RefundClaimed(uint256 indexed betId, address indexed user, uint256 amount);
    
    // Fee Events
    event PlatformFeeAccumulated(uint256 indexed betId, uint256 amount);
    event CreatorFeeCollected(uint256 indexed betId, address creator, uint256 amount);
    event FeeParametersUpdated(bool creatorEnabled, uint256 creatorAmount, bool platformEnabled, uint256 platformAmount);

    constructor() Ownable(msg.sender) {
        platformFeeRecipient = msg.sender; // Default to deployer
    }

    /**
     * @dev Create a new bet
     * @param _name Name of the bet
     * @param _options Array of betting options (2-4 options)
     * @param _duration Duration in seconds for betting period
     * @param _token Token address (address(0) for native, contract address for ERC20)
     */
    function createBet(
        string memory _name,
        string[] memory _options,
        uint256 _duration,
        address _token
    ) external returns (uint256) {
        require(_options.length >= 2 && _options.length <= 4, "Must have 2-4 options");
        require(_duration > 0, "Duration must be positive");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        uint256 betId = betCounter++;
        Bet storage bet = bets[betId];
        
        bet.name = _name;
        bet.options = _options;
        bet.creator = msg.sender;
        bet.endTime = block.timestamp + _duration;
        bet.resolutionDeadline = bet.endTime + 72 hours; // 72 hour resolution window
        bet.token = _token;
        
        emit BetCreated(betId, msg.sender, _name, _token);
        return betId;
    }
    
    /**
     * @dev Place a bet on a specific option
     * @param _betId ID of the bet
     * @param _option Option index to bet on
     * @param _amount Amount to bet (for native tokens, must match msg.value)
     */
    function placeBet(uint256 _betId, uint8 _option, uint256 _amount) external payable nonReentrant {
        require(_betId < betCounter, "Bet does not exist");
        require(_amount > 0, "Amount must be positive");
        
        Bet storage bet = bets[_betId];
        require(block.timestamp < bet.endTime, "Betting period ended");
        require(_option < bet.options.length, "Invalid option");
        require(!bet.resolved, "Bet already resolved");
        
        // Check if user has already bet on a different option
        for (uint8 i = 0; i < bet.options.length; i++) {
            if (i != _option && bet.userBets[msg.sender][i] > 0) {
                revert("Can only bet on one option per bet");
            }
        }
        
        // Handle token transfers
        if (bet.token == address(0)) {
            // Native token betting
            require(msg.value == _amount, "ETH amount mismatch");
        } else {
            // ERC20 token betting
            require(msg.value == 0, "No ETH for ERC20 bets");
            IERC20(bet.token).transferFrom(msg.sender, address(this), _amount);
        }
        
        bet.totalAmountPerOption[_option] += _amount;
        bet.userBets[msg.sender][_option] += _amount;
        
        emit BetPlaced(_betId, msg.sender, _option, _amount);
    }
    
    /**
     * @dev Resolve a bet (only creator can call within resolution window)
     * @param _betId ID of the bet to resolve
     * @param _winningOption Index of the winning option
     */
    function resolveBet(uint256 _betId, uint8 _winningOption) external {
        Bet storage bet = bets[_betId];
        require(_betId < betCounter, "Bet does not exist");
        require(msg.sender == bet.creator, "Only creator can resolve");
        require(block.timestamp >= bet.endTime, "Betting period not ended");
        require(block.timestamp < bet.resolutionDeadline, "Resolution deadline passed");
        require(!bet.resolved, "Bet already resolved");
        require(_winningOption < bet.options.length, "Invalid winning option");
        
        bet.resolved = true;
        bet.winningOption = _winningOption;
        
        // Calculate and accumulate platform fee (from losing pool only)
        if (feePlatform && feePlatformAmount > 0) {
            uint256 losingPool = _calculateLosingPool(_betId);
            if (losingPool > 0) {
                uint256 platformFee = (losingPool * feePlatformAmount) / 10000;
                if (platformFee > 0) {
                    pendingPlatformFees[platformFeeRecipient][bet.token] += platformFee;
                    emit PlatformFeeAccumulated(_betId, platformFee);
                }
            }
        }
        
        emit BetResolved(_betId, _winningOption);
    }
    
    /**
     * @dev Claim winnings for a resolved bet
     * @param _betId ID of the bet to claim winnings from
     */
    function claimWinnings(uint256 _betId) external nonReentrant {
        Bet storage bet = bets[_betId];
        require(_betId < betCounter, "Bet does not exist");
        require(bet.resolved, "Bet not resolved yet");
        require(!bet.hasClaimed[msg.sender], "Already claimed");
        
        uint256 userBet = bet.userBets[msg.sender][bet.winningOption];
        require(userBet > 0, "No winning bet placed");
        
        bet.hasClaimed[msg.sender] = true;
        
        // Calculate pari-mutuel winnings with fee deductions
        uint256 totalWinningPool = bet.totalAmountPerOption[bet.winningOption];
        uint256 losingPool = _calculateLosingPool(_betId);
        
        // Calculate fees from losing pool
        uint256 totalFees = 0;
        
        if (losingPool > 0) {
            if (feeCreator && feeCreatorAmount > 0) {
                uint256 creatorFee = (losingPool * feeCreatorAmount) / 10000;
                totalFees += creatorFee;
            }
            
            if (feePlatform && feePlatformAmount > 0) {
                uint256 platformFee = (losingPool * feePlatformAmount) / 10000;
                totalFees += platformFee;
            }
        }
        
        // Available winnings = losing pool - fees
        uint256 availableForWinners = losingPool - totalFees;
        
        // Calculate final winnings: original bet + proportional share of available winnings
        uint256 winnings = userBet;
        if (totalWinningPool > 0 && availableForWinners > 0) {
            winnings += (userBet * availableForWinners) / totalWinningPool;
        }
        
        // Transfer winnings based on token type
        if (bet.token == address(0)) {
            // Native token transfer
            payable(msg.sender).transfer(winnings);
        } else {
            // ERC20 token transfer
            IERC20(bet.token).transfer(msg.sender, winnings);
        }
        
        emit WinningsClaimed(_betId, msg.sender, winnings);
    }
    
    /**
     * @dev Claim refund for unresolved bet after resolution deadline
     * @param _betId ID of the bet to claim refund from
     */
    function claimRefund(uint256 _betId) external nonReentrant {
        Bet storage bet = bets[_betId];
        require(_betId < betCounter, "Bet does not exist");
        require(!bet.resolved, "Bet already resolved");
        require(block.timestamp >= bet.resolutionDeadline, "Resolution deadline not passed");
        require(!bet.hasClaimed[msg.sender], "Already claimed");
        
        // Calculate total user bet across all options
        uint256 totalUserBet = 0;
        for (uint8 i = 0; i < bet.options.length; i++) {
            totalUserBet += bet.userBets[msg.sender][i];
        }
        
        require(totalUserBet > 0, "No bet to refund");
        bet.hasClaimed[msg.sender] = true;
        
        // Refund based on token type (NO FEES on refunds)
        if (bet.token == address(0)) {
            // Native token refund
            payable(msg.sender).transfer(totalUserBet);
        } else {
            // ERC20 token refund
            IERC20(bet.token).transfer(msg.sender, totalUserBet);
        }
        
        emit RefundClaimed(_betId, msg.sender, totalUserBet);
    }
    
    /**
     * @dev Claim creator fees for a resolved bet (separate from winnings)
     * @param _betId ID of the bet to claim creator fees from
     */
    function claimCreatorFees(uint256 _betId) external nonReentrant {
        Bet storage bet = bets[_betId];
        require(_betId < betCounter, "Bet does not exist");
        require(bet.resolved, "Bet not resolved yet");
        require(msg.sender == bet.creator, "Only creator can claim creator fees");
        require(!bet.hasClaimed[msg.sender], "Already claimed");
        
        // Only allow if creator fees are enabled
        require(feeCreator && feeCreatorAmount > 0, "Creator fees not enabled");
        
        uint256 losingPool = _calculateLosingPool(_betId);
        require(losingPool > 0, "No losing pool to claim fees from");
        
        // Calculate creator fee
        uint256 creatorFee = (losingPool * feeCreatorAmount) / 10000;
        require(creatorFee > 0, "No creator fees to claim");
        
        // Mark as claimed to prevent double claiming
        bet.hasClaimed[msg.sender] = true;
        
        // Transfer creator fee based on token type
        if (bet.token == address(0)) {
            // Native token transfer
            payable(msg.sender).transfer(creatorFee);
        } else {
            // ERC20 token transfer
            IERC20(bet.token).transfer(msg.sender, creatorFee);
        }
        
        emit CreatorFeeCollected(_betId, msg.sender, creatorFee);
    }
    
    /**
     * @dev Claim accumulated platform fees (pull-based)
     * @param token Token address to claim fees for
     */
    function claimPlatformFees(address token) external {
        uint256 amount = pendingPlatformFees[msg.sender][token];
        require(amount > 0, "No fees to claim");
        
        pendingPlatformFees[msg.sender][token] = 0;
        
        // Transfer fees based on token type
        if (token == address(0)) {
            // Native token transfer
            payable(msg.sender).transfer(amount);
        } else {
            // ERC20 token transfer
            IERC20(token).transfer(msg.sender, amount);
        }
    }
    
    // ========== ADMINISTRATIVE FUNCTIONS ==========
    
    /**
     * @dev Update creator fee settings (onlyOwner)
     * @param enabled Whether creator fees are enabled
     * @param amount Fee amount in basis points (max 300 = 3%)
     */
    function updateFeeCreator(bool enabled, uint256 amount) external onlyOwner {
        require(amount <= MAX_CREATOR_FEE, "Creator fee too high");
        feeCreator = enabled;
        feeCreatorAmount = amount;
        emit FeeParametersUpdated(feeCreator, feeCreatorAmount, feePlatform, feePlatformAmount);
    }
    
    /**
     * @dev Update platform fee settings (onlyOwner)
     * @param enabled Whether platform fees are enabled
     * @param amount Fee amount in basis points (max 100 = 1%)
     */
    function updateFeePlatform(bool enabled, uint256 amount) external onlyOwner {
        require(amount <= MAX_PLATFORM_FEE, "Platform fee too high");
        feePlatform = enabled;
        feePlatformAmount = amount;
        emit FeeParametersUpdated(feeCreator, feeCreatorAmount, feePlatform, feePlatformAmount);
    }
    
    /**
     * @dev Update platform fee recipient (onlyOwner)
     * @param newRecipient New platform fee recipient address
     */
    function updatePlatformFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        platformFeeRecipient = newRecipient;
    }
    
    /**
     * @dev Emergency function to disable all fees (onlyOwner)
     */
    function emergencyDisableFees() external onlyOwner {
        feeCreator = false;
        feePlatform = false;
        emit FeeParametersUpdated(false, feeCreatorAmount, false, feePlatformAmount);
    }
    
    // ========== INTERNAL HELPER FUNCTIONS ==========
    
    /**
     * @dev Calculate losing pool for a bet
     * @param _betId ID of the bet
     * @return losingPool Total amount in losing options
     */
    function _calculateLosingPool(uint256 _betId) internal view returns (uint256) {
        Bet storage bet = bets[_betId];
        uint256 losingPool = 0;
        
        for (uint8 i = 0; i < bet.options.length; i++) {
            if (i != bet.winningOption) {
                losingPool += bet.totalAmountPerOption[i];
            }
        }
        
        return losingPool;
    }
    
    // ========== VIEW FUNCTIONS (KEEPING V1 STRUCTURE) ==========
    
    /**
     * @dev Get comprehensive bet details (SAME AS V1)
     * @param _betId ID of the bet
     * @return name The name of the bet
     * @return options Array of betting options
     * @return creator Address of the bet creator
     * @return endTime When betting period ends
     * @return resolved Whether the bet is resolved
     * @return winningOption Index of winning option (if resolved)
     * @return totalAmounts Total amounts bet on each option
     * @return token Token address used for betting
     */
    function getBetDetails(uint256 _betId) external view returns (
        string memory name,
        string[] memory options,
        address creator,
        uint256 endTime,
        bool resolved,
        uint8 winningOption,
        uint256[] memory totalAmounts,
        address token
    ) {
        require(_betId < betCounter, "Bet does not exist");
        Bet storage bet = bets[_betId];
        
        // Build total amounts array
        totalAmounts = new uint256[](bet.options.length);
        for (uint8 i = 0; i < bet.options.length; i++) {
            totalAmounts[i] = bet.totalAmountPerOption[i];
        }
        
        return (
            bet.name,
            bet.options,
            bet.creator,
            bet.endTime,
            bet.resolved,
            bet.winningOption,
            totalAmounts,
            bet.token
        );
    }
    
    /**
     * @dev Get user's bets for a specific bet (SAME AS V1)
     * @param _betId ID of the bet
     * @param _user Address of the user
     * @return userBets Array of bet amounts per option
     */
    function getUserBets(uint256 _betId, address _user) external view returns (uint256[] memory) {
        require(_betId < betCounter, "Bet does not exist");
        Bet storage bet = bets[_betId];
        
        uint256[] memory userBets = new uint256[](bet.options.length);
        for (uint8 i = 0; i < bet.options.length; i++) {
            userBets[i] = bet.userBets[_user][i];
        }
        
        return userBets;
    }
    
    /**
     * @dev Check if user has claimed winnings/refund (SAME AS V1)
     * @param _betId ID of the bet
     * @param _user Address of the user
     * @return claimed Whether user has claimed
     */
    function hasUserClaimed(uint256 _betId, address _user) external view returns (bool) {
        require(_betId < betCounter, "Bet does not exist");
        return bets[_betId].hasClaimed[_user];
    }
    
    /**
     * @dev Get resolution deadline timestamp (SAME AS V1)
     * @param _betId ID of the bet
     * @return deadline Resolution deadline timestamp
     */
    function getResolutionDeadline(uint256 _betId) external view returns (uint256) {
        require(_betId < betCounter, "Bet does not exist");
        return bets[_betId].resolutionDeadline;
    }
    
    // ========== NEW V2 VIEW FUNCTIONS ==========
    
    /**
     * @dev Calculate potential winnings for a user (preview before claiming)
     * @param _betId ID of the bet
     * @param _user Address of the user
     * @return winnings Potential winnings amount
     */
    function calculatePotentialWinnings(uint256 _betId, address _user) external view returns (uint256) {
        require(_betId < betCounter, "Bet does not exist");
        Bet storage bet = bets[_betId];
        require(bet.resolved, "Bet not resolved");
        
        uint256 userBet = bet.userBets[_user][bet.winningOption];
        if (userBet == 0) return 0;
        
        uint256 totalWinningPool = bet.totalAmountPerOption[bet.winningOption];
        uint256 losingPool = _calculateLosingPool(_betId);
        
        // Calculate fees from losing pool
        uint256 totalFees = 0;
        
        if (losingPool > 0) {
            if (feeCreator && feeCreatorAmount > 0) {
                uint256 creatorFee = (losingPool * feeCreatorAmount) / 10000;
                totalFees += creatorFee;
            }
            
            if (feePlatform && feePlatformAmount > 0) {
                uint256 platformFee = (losingPool * feePlatformAmount) / 10000;
                totalFees += platformFee;
            }
        }
        
        // Available winnings = losing pool - fees
        uint256 availableForWinners = losingPool - totalFees;
        
        // Calculate final winnings: original bet + proportional share
        uint256 winnings = userBet;
        if (totalWinningPool > 0 && availableForWinners > 0) {
            winnings += (userBet * availableForWinners) / totalWinningPool;
        }
        
        return winnings;
    }
    
    /**
     * @dev Get current fee parameters
     * @return creatorEnabled Whether creator fees are enabled
     * @return creatorAmount Creator fee amount in basis points
     * @return platformEnabled Whether platform fees are enabled
     * @return platformAmount Platform fee amount in basis points
     * @return recipient Platform fee recipient address
     */
    function getFeeParameters() external view returns (
        bool creatorEnabled,
        uint256 creatorAmount,
        bool platformEnabled,
        uint256 platformAmount,
        address recipient
    ) {
        return (
            feeCreator,
            feeCreatorAmount,
            feePlatform,
            feePlatformAmount,
            platformFeeRecipient
        );
    }
    
    // Accept native token deposits
    receive() external payable {
        // Allow contract to receive native tokens
    }
    
    // Fallback function
    fallback() external payable {
        revert("Function not found");
    }
}