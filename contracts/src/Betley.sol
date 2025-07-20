// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Betley - Security Fixed Version
 * @dev Multi-token pari-mutuel betting contract with optional fee system
 *      SECURITY FIXES APPLIED:
 *      - M1: Fee calculation race condition fixed by locking fees at resolution
 *      - M2: Fee griefing fixed by reserving fees upfront 
 *      - M3: Creator fee double-spend fixed with separate tracking
 */
contract Betley is ReentrancyGuard, Ownable {
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
        // M1 & M2 FIX: Lock fee amounts at resolution time to prevent race conditions
        uint256 lockedCreatorFee;    // Fee amount locked at resolution
        uint256 lockedPlatformFee;   // Fee amount locked at resolution
        bool feesLocked;             // Whether fees have been calculated and locked
        // M3 FIX: Separate tracking for creator fee claims
        mapping(address => bool) hasClaimedCreatorFee;
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
        // Fees start unlocked (will be locked during resolution)
        bet.feesLocked = false;
        
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
        
        // M1 & M2 FIX: Calculate and lock all fees at resolution time
        uint256 losingPool = _calculateLosingPool(_betId);
        if (losingPool > 0) {
            // Calculate creator fee
            if (feeCreator && feeCreatorAmount > 0) {
                bet.lockedCreatorFee = (losingPool * feeCreatorAmount) / 10000;
            }
            
            // Calculate and accumulate platform fee
            if (feePlatform && feePlatformAmount > 0) {
                bet.lockedPlatformFee = (losingPool * feePlatformAmount) / 10000;
                // Immediately add to platform fee accumulation
                pendingPlatformFees[platformFeeRecipient][bet.token] += bet.lockedPlatformFee;
                emit PlatformFeeAccumulated(_betId, bet.lockedPlatformFee);
            }
            
            // Lock fees to prevent recalculation
            bet.feesLocked = true;
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
        
        // Handle refund case (resolution deadline passed, bet not resolved)
        if (block.timestamp >= bet.resolutionDeadline && !bet.resolved) {
            require(!bet.hasClaimed[msg.sender], "Already claimed");
            
            uint256 totalUserBet = 0;
            for (uint8 i = 0; i < bet.options.length; i++) {
                totalUserBet += bet.userBets[msg.sender][i];
            }
            require(totalUserBet > 0, "No bet to refund");
            
            bet.hasClaimed[msg.sender] = true;
            
            // Transfer refund based on token type
            if (bet.token == address(0)) {
                payable(msg.sender).transfer(totalUserBet);
            } else {
                IERC20(bet.token).transfer(msg.sender, totalUserBet);
            }
            
            emit RefundClaimed(_betId, msg.sender, totalUserBet);
            return;
        }
        
        // Regular winnings claim
        require(bet.resolved, "Bet not resolved yet");
        require(!bet.hasClaimed[msg.sender], "Already claimed");
        
        uint256 userBet = bet.userBets[msg.sender][bet.winningOption];
        require(userBet > 0, "No winning bet placed");
        
        bet.hasClaimed[msg.sender] = true;
        
        // M2 FIX: Use pre-calculated and locked fees instead of recalculating
        uint256 totalWinningPool = bet.totalAmountPerOption[bet.winningOption];
        uint256 losingPool = _calculateLosingPool(_betId);
        
        // Calculate winnings using locked fees
        uint256 totalLockedFees = bet.lockedCreatorFee + bet.lockedPlatformFee;
        uint256 availableForWinners = losingPool;
        
        if (totalLockedFees > 0 && totalLockedFees <= losingPool) {
            availableForWinners = losingPool - totalLockedFees;
        }
        
        // Calculate final winnings: original bet + proportional share
        uint256 winnings = userBet;
        if (totalWinningPool > 0 && availableForWinners > 0) {
            winnings += (userBet * availableForWinners) / totalWinningPool;
        }
        
        // Transfer winnings based on token type
        if (bet.token == address(0)) {
            payable(msg.sender).transfer(winnings);
        } else {
            IERC20(bet.token).transfer(msg.sender, winnings);
        }
        
        emit WinningsClaimed(_betId, msg.sender, winnings);
    }
    
    /**
     * @dev Claim refund for unresolved bet (when resolution deadline passed)
     * @param _betId ID of the bet to claim refund from
     */
    function claimRefund(uint256 _betId) external nonReentrant {
        Bet storage bet = bets[_betId];
        require(_betId < betCounter, "Bet does not exist");
        require(block.timestamp >= bet.resolutionDeadline, "Resolution deadline not passed");
        require(!bet.resolved, "Bet already resolved");
        require(!bet.hasClaimed[msg.sender], "Already claimed");
        
        uint256 totalUserBet = 0;
        for (uint8 i = 0; i < bet.options.length; i++) {
            totalUserBet += bet.userBets[msg.sender][i];
        }
        require(totalUserBet > 0, "No bet to refund");
        
        bet.hasClaimed[msg.sender] = true;
        
        // Transfer refund based on token type
        if (bet.token == address(0)) {
            payable(msg.sender).transfer(totalUserBet);
        } else {
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
        
        // M3 FIX: Use separate tracking for creator fee claims
        require(!bet.hasClaimedCreatorFee[msg.sender], "Creator fees already claimed");
        
        // Only allow if creator fees are enabled and locked
        require(feeCreator && bet.feesLocked && bet.lockedCreatorFee > 0, "No creator fees available");
        
        // Mark as claimed to prevent double claiming
        bet.hasClaimedCreatorFee[msg.sender] = true;
        
        // Transfer creator fee based on token type
        if (bet.token == address(0)) {
            payable(msg.sender).transfer(bet.lockedCreatorFee);
        } else {
            IERC20(bet.token).transfer(msg.sender, bet.lockedCreatorFee);
        }
        
        emit CreatorFeeCollected(_betId, msg.sender, bet.lockedCreatorFee);
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
            payable(msg.sender).transfer(amount);
        } else {
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
    
    // ========== VIEW FUNCTIONS ==========
    
    /**
     * @dev Get comprehensive bet details (SAME AS V1 - EXACT COMPATIBILITY)
     * @param _betId ID of the bet
     * @return name The name of the bet
     * @return options Array of betting options
     * @return creator Address of the bet creator
     * @return endTime When betting period ends
     * @return resolved Whether the bet is resolved
     * @return winningOption Index of winning option (if resolved)
     * @return totalAmounts Total amounts bet on each option
     */
    function getBetDetails(uint256 _betId) external view returns (
        string memory name,
        string[] memory options,
        address creator,
        uint256 endTime,
        bool resolved,
        uint8 winningOption,
        uint256[] memory totalAmounts
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
            totalAmounts
        );
    }
    
    /**
     * @dev Get user's bets for a specific bet
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
     * @dev Check if user has claimed winnings/refund
     * @param _betId ID of the bet
     * @param _user Address of the user
     * @return claimed Whether user has claimed winnings/refund
     */
    function hasUserClaimed(uint256 _betId, address _user) external view returns (bool) {
        require(_betId < betCounter, "Bet does not exist");
        return bets[_betId].hasClaimed[_user];
    }
    
    /**
     * @dev Check if user has claimed creator fees (M3 FIX: separate from winnings)
     * @param _betId ID of the bet
     * @param _user Address of the user
     * @return claimed Whether user has claimed creator fees
     */
    function hasClaimedCreatorFees(uint256 _betId, address _user) external view returns (bool) {
        require(_betId < betCounter, "Bet does not exist");
        return bets[_betId].hasClaimedCreatorFee[_user];
    }
    
    /**
     * @dev Get resolution deadline timestamp
     * @param _betId ID of the bet
     * @return deadline Resolution deadline timestamp
     */
    function getResolutionDeadline(uint256 _betId) external view returns (uint256) {
        require(_betId < betCounter, "Bet does not exist");
        return bets[_betId].resolutionDeadline;
    }
    
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
        
        // Use locked fees for calculation
        uint256 totalLockedFees = bet.lockedCreatorFee + bet.lockedPlatformFee;
        uint256 availableForWinners = losingPool;
        
        if (totalLockedFees > 0 && totalLockedFees <= losingPool) {
            availableForWinners = losingPool - totalLockedFees;
        }
        
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