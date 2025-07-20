// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Betley - Production Pari-Mutuel Betting Platform
 * @dev Secure, fee-enabled betting contract with comprehensive safety measures
 * @author Betley Team
 * @notice V2 with advanced fee system and enhanced security
 */
contract Betley is Ownable, ReentrancyGuard {
    
    // ========== STRUCTS ==========
    
    struct Bet {
        string name;
        string[] options;
        address creator;
        uint256 endTime;
        uint256 resolutionDeadline;
        bool resolved;
        uint8 winningOption;
        mapping(uint8 => uint256) totalAmountPerOption;
        mapping(address => mapping(uint8 => uint256)) userBets;
        mapping(address => bool) hasClaimed;
        mapping(address => bool) hasClaimedCreatorFee;
        address token; // Token contract address (address(0) for native)
        
        // Fee tracking per bet
        uint256 lockedCreatorFee;
        uint256 lockedPlatformFee;
        bool feesLocked;
    }
    
    // ========== STATE VARIABLES ==========
    
    mapping(uint256 => Bet) public bets;
    uint256 public betCounter;
    
    // Fee configuration
    bool public feeCreator = false;          // Creator fee enabled/disabled
    uint256 public feeCreatorAmount = 200;   // 2% in basis points (200/10000)
    bool public feePlatform = false;         // Platform fee enabled/disabled  
    uint256 public feePlatformAmount = 100;  // 1% in basis points (100/10000)
    address public platformFeeRecipient;
    
    // Fee constants (safety limits)
    uint256 public constant MAX_CREATOR_FEE = 300;  // 3% maximum
    uint256 public constant MAX_PLATFORM_FEE = 100; // 1% maximum
    
    // Fee accumulation tracking
    mapping(address => mapping(address => uint256)) public pendingCreatorFees; // token => creator => amount
    mapping(address => uint256) public pendingPlatformFees; // token => amount
    
    // ========== EVENTS ==========
    
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
        Bet storage bet = bets[_betId];
        require(block.timestamp < bet.endTime, "Betting period ended");
        require(!bet.resolved, "Bet already resolved");
        require(_option < bet.options.length, "Invalid option");
        require(_amount > 0, "Amount must be positive");
        require(bet.userBets[msg.sender][_option] == 0, "Already bet on this option");
        
        // Handle payment based on token type
        if (bet.token == address(0)) {
            // Native token
            require(msg.value == _amount, "Incorrect native amount");
        } else {
            // ERC20 token
            require(msg.value == 0, "No native tokens for ERC20 bet");
            IERC20(bet.token).transferFrom(msg.sender, address(this), _amount);
        }
        
        bet.userBets[msg.sender][_option] = _amount;
        bet.totalAmountPerOption[_option] += _amount;
        
        emit BetPlaced(_betId, msg.sender, _option, _amount);
    }
    
    /**
     * @dev Resolve a bet (only by creator)
     * @param _betId ID of the bet
     * @param _winningOption Index of the winning option
     */
    function resolveBet(uint256 _betId, uint8 _winningOption) external nonReentrant {
        require(_betId < betCounter, "Bet does not exist");
        Bet storage bet = bets[_betId];
        require(msg.sender == bet.creator, "Only creator can resolve");
        require(block.timestamp >= bet.endTime, "Betting period not ended");
        require(!bet.resolved, "Already resolved");
        require(_winningOption < bet.options.length, "Invalid winning option");
        
        bet.resolved = true;
        bet.winningOption = _winningOption;
        
        // Calculate and lock fees during resolution
        _lockFees(_betId);
        
        emit BetResolved(_betId, _winningOption);
    }
    
    /**
     * @dev Calculate and lock fees when bet is resolved
     * @param _betId ID of the bet
     */
    function _lockFees(uint256 _betId) internal {
        Bet storage bet = bets[_betId];
        if (bet.feesLocked) return; // Already locked
        
        uint256 losingPool = _calculateLosingPool(_betId);
        if (losingPool == 0) {
            bet.feesLocked = true;
            return; // No fees if no losing pool
        }
        
        // Calculate creator fee
        if (feeCreator && feeCreatorAmount > 0) {
            uint256 creatorFee = (losingPool * feeCreatorAmount) / 10000;
            bet.lockedCreatorFee = creatorFee;
            pendingCreatorFees[bet.token][bet.creator] += creatorFee;
        }
        
        // Calculate platform fee
        if (feePlatform && feePlatformAmount > 0) {
            uint256 platformFee = (losingPool * feePlatformAmount) / 10000;
            bet.lockedPlatformFee = platformFee;
            pendingPlatformFees[bet.token] += platformFee;
            emit PlatformFeeAccumulated(_betId, platformFee);
        }
        
        bet.feesLocked = true;
    }
    
    /**
     * @dev Claim winnings after bet resolution
     * @param _betId ID of the bet
     */
    function claimWinnings(uint256 _betId) external nonReentrant {
        require(_betId < betCounter, "Bet does not exist");
        Bet storage bet = bets[_betId];
        require(bet.resolved, "Bet not resolved");
        require(!bet.hasClaimed[msg.sender], "Already claimed");
        
        uint256 userBet = bet.userBets[msg.sender][bet.winningOption];
        require(userBet > 0, "No winning bet to claim");
        
        bet.hasClaimed[msg.sender] = true;
        
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
        
        _transferTokens(bet.token, msg.sender, winnings);
        emit WinningsClaimed(_betId, msg.sender, winnings);
    }
    
    /**
     * @dev Claim refund if bet resolution deadline passed without resolution
     * @param _betId ID of the bet
     */
    function claimRefund(uint256 _betId) external nonReentrant {
        require(_betId < betCounter, "Bet does not exist");
        Bet storage bet = bets[_betId];
        require(!bet.resolved, "Bet already resolved");
        require(block.timestamp > bet.resolutionDeadline, "Resolution deadline not passed");
        require(!bet.hasClaimed[msg.sender], "Already claimed");
        
        // Calculate total user bet across all options
        uint256 totalUserBet = 0;
        for (uint8 i = 0; i < bet.options.length; i++) {
            totalUserBet += bet.userBets[msg.sender][i];
        }
        require(totalUserBet > 0, "No bet to refund");
        
        bet.hasClaimed[msg.sender] = true;
        
        _transferTokens(bet.token, msg.sender, totalUserBet);
        emit RefundClaimed(_betId, msg.sender, totalUserBet);
    }
    
    /**
     * @dev Creator claims their accumulated fees for a specific token
     * @param _betId ID of the bet to claim creator fees from
     */
    function claimCreatorFees(uint256 _betId) external nonReentrant {
        require(_betId < betCounter, "Bet does not exist");
        Bet storage bet = bets[_betId];
        require(bet.resolved, "Bet not resolved");
        require(msg.sender == bet.creator, "Only creator can claim");
        require(!bet.hasClaimedCreatorFee[msg.sender], "Creator fees already claimed");
        
        uint256 feeAmount = bet.lockedCreatorFee;
        require(feeAmount > 0, "No creator fees to claim");
        
        bet.hasClaimedCreatorFee[msg.sender] = true;
        pendingCreatorFees[bet.token][bet.creator] -= feeAmount;
        
        _transferTokens(bet.token, msg.sender, feeAmount);
        emit CreatorFeeCollected(_betId, msg.sender, feeAmount);
    }
    
    /**
     * @dev Platform claims accumulated fees for a specific token (onlyOwner)
     * @param token Token address to claim fees for
     */
    function claimPlatformFees(address token) external onlyOwner nonReentrant {
        uint256 feeAmount = pendingPlatformFees[token];
        require(feeAmount > 0, "No platform fees to claim");
        
        pendingPlatformFees[token] = 0;
        _transferTokens(token, platformFeeRecipient, feeAmount);
    }
    
    /**
     * @dev Internal function to transfer tokens (native or ERC20)
     * @param token Token address (address(0) for native)
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function _transferTokens(address token, address to, uint256 amount) internal {
        if (token == address(0)) {
            // Native token
            (bool success, ) = to.call{value: amount}("");
            require(success, "Native transfer failed");
        } else {
            // ERC20 token
            IERC20(token).transfer(to, amount);
        }
    }
    
    // ========== ADMINISTRATIVE FUNCTIONS ==========
    
    /**
     * @dev Update creator fee settings (onlyOwner)
     * @param enabled Whether creator fees are enabled
     * @param amount Fee amount in basis points (e.g., 200 = 2%)
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
     * @param amount Fee amount in basis points (e.g., 100 = 1%)
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
     * @dev Get comprehensive bet details INCLUDING TOKEN ADDRESS (FIXED FOR V2)
     * @param _betId ID of the bet
     * @return name The name of the bet
     * @return options Array of betting options
     * @return creator Address of the bet creator
     * @return endTime When betting period ends
     * @return resolved Whether the bet is resolved
     * @return winningOption Index of winning option (if resolved)
     * @return totalAmounts Total amounts bet on each option
     * @return token Token address used for this bet (ADDED - INDEX 7)
     */
    function getBetDetails(uint256 _betId) external view returns (
        string memory name,
        string[] memory options,
        address creator,
        uint256 endTime,
        bool resolved,
        uint8 winningOption,
        uint256[] memory totalAmounts,
        address token  // ← FIXED: Added token address as 8th return value
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
            bet.token  // ← FIXED: Now returning token address
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
     * @dev Check if user has claimed creator fees (separate from winnings)
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