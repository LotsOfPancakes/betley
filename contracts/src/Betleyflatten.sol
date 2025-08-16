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
 * @title Betley - Privacy-Focused Pari-Mutuel Betting Platform
 * @dev Secure betting contract with minimal on-chain data for enhanced privacy
 * @author Betley Team
 * @notice New architecture: sensitive data stored off-chain, only operational data on-chain
 */
contract Betley is Ownable, ReentrancyGuard {
    // ========== STRUCTS ==========

    struct Bet {
        // ❌ REMOVED: name, options[] - stored in database for privacy
        address creator;
        uint256 endTime;
        uint256 resolutionDeadline;
        bool resolved;
        uint8 winningOption;
        uint8 optionCount; // Just the number of options (2-4), not the actual option text
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

    // ❌ CHANGED: Make bets mapping private to prevent enumeration
    mapping(uint256 => Bet) private bets;
    uint256 public betCounter;

    // Whitelist functionality
    mapping(uint256 => mapping(address => bool)) public whitelist;
    mapping(uint256 => bool) public hasWhitelist;

    // Fee configuration
    bool public feeCreator = false; // Creator fee enabled/disabled
    uint256 public feeCreatorAmount = 200; // 2% in basis points (200/10000)
    bool public feePlatform = false; // Platform fee enabled/disabled
    uint256 public feePlatformAmount = 100; // 1% in basis points (100/10000)
    address public platformFeeRecipient;

    // Fee constants (safety limits)
    uint256 public constant MAX_CREATOR_FEE = 300; // 3% maximum
    uint256 public constant MAX_PLATFORM_FEE = 100; // 1% maximum

    // Fee accumulation tracking
    mapping(address => mapping(address => uint256)) public pendingCreatorFees; // token => creator => amount
    mapping(address => uint256) public pendingPlatformFees; // token => amount

    // ========== EVENTS ==========

    // ❌ CHANGED: Remove sensitive data from events
    event BetCreated(uint256 indexed betId, address indexed creator, uint8 optionCount, address token);
    event BetPlaced(uint256 indexed betId, address indexed user, uint8 option, uint256 amount);
    event BetResolved(uint256 indexed betId, uint8 winningOption);
    event WinningsClaimed(uint256 indexed betId, address indexed user, uint256 amount);
    event RefundClaimed(uint256 indexed betId, address indexed user, uint256 amount);

    // Whitelist Events
    event WhitelistEnabled(uint256 indexed betId);
    event WhitelistDisabled(uint256 indexed betId);
    event AddressWhitelisted(uint256 indexed betId, address indexed user);
    event AddressRemovedFromWhitelist(uint256 indexed betId, address indexed user);

    // Fee Events
    event PlatformFeeAccumulated(uint256 indexed betId, uint256 amount);
    event CreatorFeeCollected(uint256 indexed betId, address creator, uint256 amount);
    event FeeParametersUpdated(
        bool creatorEnabled, uint256 creatorAmount, bool platformEnabled, uint256 platformAmount
    );

    constructor() Ownable(msg.sender) {
        platformFeeRecipient = msg.sender; // Default to deployer
    }

    /**
     * @dev Create a new bet with minimal on-chain data and optional whitelist
     * @param _optionCount Number of betting options (2-4)
     * @param _duration Duration in seconds for betting period
     * @param _token Token address (address(0) for native, contract address for ERC20)
     * @param _whitelistedAddresses Array of addresses allowed to participate (empty = open to all)
     * @notice Bet name and options are stored off-chain for privacy
     */
    function createBet(uint8 _optionCount, uint256 _duration, address _token, address[] memory _whitelistedAddresses) external returns (uint256) {
        require(_optionCount >= 2 && _optionCount <= 4, "Must have 2-4 options");
        require(_duration > 0, "Duration must be positive");

        uint256 betId = betCounter++;
        Bet storage bet = bets[betId];

        // ✅ ONLY store operational data, no sensitive information
        bet.creator = msg.sender;
        bet.optionCount = _optionCount;
        bet.endTime = block.timestamp + _duration;
        bet.resolutionDeadline = bet.endTime + 24 hours; // 24 hour resolution window
        bet.token = _token;
        bet.feesLocked = false;

        // Handle whitelist setup
        if (_whitelistedAddresses.length > 0) {
            hasWhitelist[betId] = true;
            
            // Add whitelisted addresses
            for (uint256 i = 0; i < _whitelistedAddresses.length; i++) {
                require(_whitelistedAddresses[i] != address(0), "Invalid whitelist address");
                whitelist[betId][_whitelistedAddresses[i]] = true;
                emit AddressWhitelisted(betId, _whitelistedAddresses[i]);
            }
            
            // Creator is automatically whitelisted
            if (!whitelist[betId][msg.sender]) {
                whitelist[betId][msg.sender] = true;
                emit AddressWhitelisted(betId, msg.sender);
            }
            
            emit WhitelistEnabled(betId);
        }

        emit BetCreated(betId, msg.sender, _optionCount, _token);
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
        require(_option < bet.optionCount, "Invalid option");
        require(_amount > 0, "Amount must be positive");

        // Check whitelist if enabled
        if (hasWhitelist[_betId]) {
            require(whitelist[_betId][msg.sender], "Address not whitelisted");
        }

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
        require(!bet.resolved, "Already resolved");
        require(_winningOption < bet.optionCount, "Invalid winning option");
        require(bet.totalAmountPerOption[_winningOption] > 0, "Cannot resolve to option with no bets");

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
        for (uint8 i = 0; i < bet.optionCount; i++) {
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
            (bool success,) = to.call{value: amount}("");
            require(success, "Native transfer failed");
        } else {
            // ERC20 token
            IERC20(token).transfer(to, amount);
        }
    }

    // ========== WHITELIST MANAGEMENT FUNCTIONS ==========

    /**
     * @dev Add address to bet whitelist (only creator)
     * @param _betId ID of the bet
     * @param _user Address to add to whitelist
     */
    function addToWhitelist(uint256 _betId, address _user) external {
        require(_betId < betCounter, "Bet does not exist");
        Bet storage bet = bets[_betId];
        require(msg.sender == bet.creator, "Only creator can manage whitelist");
        require(_user != address(0), "Invalid address");
        require(block.timestamp < bet.endTime, "Betting period ended");

        if (!hasWhitelist[_betId]) {
            hasWhitelist[_betId] = true;
            emit WhitelistEnabled(_betId);
        }

        if (!whitelist[_betId][_user]) {
            whitelist[_betId][_user] = true;
            emit AddressWhitelisted(_betId, _user);
        }
    }

    /**
     * @dev Remove address from bet whitelist (only creator)
     * @param _betId ID of the bet
     * @param _user Address to remove from whitelist
     */
    function removeFromWhitelist(uint256 _betId, address _user) external {
        require(_betId < betCounter, "Bet does not exist");
        Bet storage bet = bets[_betId];
        require(msg.sender == bet.creator, "Only creator can manage whitelist");
        require(_user != bet.creator, "Cannot remove creator from whitelist");

        if (whitelist[_betId][_user]) {
            whitelist[_betId][_user] = false;
            emit AddressRemovedFromWhitelist(_betId, _user);
        }
    }

    /**
     * @dev Disable whitelist for a bet (only creator)
     * @param _betId ID of the bet
     */
    function disableWhitelist(uint256 _betId) external {
        require(_betId < betCounter, "Bet does not exist");
        Bet storage bet = bets[_betId];
        require(msg.sender == bet.creator, "Only creator can manage whitelist");
        require(block.timestamp < bet.endTime, "Betting period ended");

        if (hasWhitelist[_betId]) {
            hasWhitelist[_betId] = false;
            emit WhitelistDisabled(_betId);
        }
    }

    /**
     * @dev Check if address is whitelisted for a bet
     * @param _betId ID of the bet
     * @param _user Address to check
     * @return isWhitelisted True if address can participate (no whitelist or address is whitelisted)
     */
    function isWhitelisted(uint256 _betId, address _user) external view returns (bool) {
        require(_betId < betCounter, "Bet does not exist");
        
        if (!hasWhitelist[_betId]) {
            return true; // No whitelist = open to all
        }
        
        return whitelist[_betId][_user];
    }

    /**
     * @dev Get whitelist status for a bet
     * @param _betId ID of the bet
     * @return enabled True if whitelist is enabled for this bet
     */
    function getWhitelistStatus(uint256 _betId) external view returns (bool) {
        require(_betId < betCounter, "Bet does not exist");
        return hasWhitelist[_betId];
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

        for (uint8 i = 0; i < bet.optionCount; i++) {
            if (i != bet.winningOption) {
                losingPool += bet.totalAmountPerOption[i];
            }
        }

        return losingPool;
    }

    // ========== NEW MINIMAL VIEW FUNCTIONS ==========

    /**
     * @dev Get basic bet information (no sensitive data)
     * @param _betId ID of the bet
     * @return creator Address of the bet creator
     * @return endTime When betting period ends
     * @return resolved Whether the bet is resolved
     * @return winningOption Index of winning option (if resolved)
     * @return optionCount Number of betting options
     * @return token Token address used for this bet
     */
    function getBetBasics(uint256 _betId)
        external
        view
        returns (address creator, uint256 endTime, bool resolved, uint8 winningOption, uint8 optionCount, address token)
    {
        require(_betId < betCounter, "Bet does not exist");
        Bet storage bet = bets[_betId];

        return (bet.creator, bet.endTime, bet.resolved, bet.winningOption, bet.optionCount, bet.token);
    }

    /**
     * @dev Get betting amounts for all options
     * @param _betId ID of the bet
     * @return totalAmounts Array of total amounts bet on each option
     */
    function getBetAmounts(uint256 _betId) external view returns (uint256[] memory) {
        require(_betId < betCounter, "Bet does not exist");
        Bet storage bet = bets[_betId];

        uint256[] memory totalAmounts = new uint256[](bet.optionCount);
        for (uint8 i = 0; i < bet.optionCount; i++) {
            totalAmounts[i] = bet.totalAmountPerOption[i];
        }

        return totalAmounts;
    }

    /**
     * @dev Check if betting is still active for a bet
     * @param _betId ID of the bet
     * @return canBet Whether betting is still active
     */
    function canPlaceBet(uint256 _betId) external view returns (bool) {
        require(_betId < betCounter, "Bet does not exist");
        Bet storage bet = bets[_betId];

        return block.timestamp < bet.endTime && !bet.resolved;
    }

    /**
     * @dev Check if a specific user can place bet (includes whitelist check)
     * @param _betId ID of the bet
     * @param _user Address of the user
     * @return canBet Whether user can place bet
     */
    function canUserPlaceBet(uint256 _betId, address _user) external view returns (bool) {
        require(_betId < betCounter, "Bet does not exist");
        Bet storage bet = bets[_betId];

        // Check basic betting conditions
        if (block.timestamp >= bet.endTime || bet.resolved) {
            return false;
        }

        // Check whitelist if enabled
        if (hasWhitelist[_betId]) {
            return whitelist[_betId][_user];
        }

        return true;
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

        uint256[] memory userBets = new uint256[](bet.optionCount);
        for (uint8 i = 0; i < bet.optionCount; i++) {
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
    function getFeeParameters()
        external
        view
        returns (
            bool creatorEnabled,
            uint256 creatorAmount,
            bool platformEnabled,
            uint256 platformAmount,
            address recipient
        )
    {
        return (feeCreator, feeCreatorAmount, feePlatform, feePlatformAmount, platformFeeRecipient);
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
