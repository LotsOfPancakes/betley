// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// lib/openzeppelin-contracts/contracts/utils/Context.sol

// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

// lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol

// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC20/IERC20.sol)

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

// lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol

// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}

// lib/openzeppelin-contracts/contracts/access/Ownable.sol

// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// src/Betley.sol

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
        bet.resolutionDeadline = bet.endTime + 48 hours; // 48 hour resolution window
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
        
        // Handle payment based on token type
        if (bet.token == address(0)) {
            // Native token
            require(msg.value == _amount, "Incorrect native amount");
        } else {
            // ERC20 token
            require(msg.value == 0, "No native tokens for ERC20 bet");
            IERC20(bet.token).transferFrom(msg.sender, address(this), _amount);
        }
        
        bet.userBets[msg.sender][_option] += _amount;
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

