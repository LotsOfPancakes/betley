// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title BetleyNative
 * @dev Multi-token pari-mutuel betting contract supporting both native tokens and ERC20s
 */
contract BetleyNative is ReentrancyGuard {
    struct Bet {
        string name;
        string[] options;
        address creator;
        uint256 startTime;
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
    
    // Events
    event BetCreated(uint256 indexed betId, address indexed creator, string name, address token);
    event BetPlaced(uint256 indexed betId, address indexed user, uint8 option, uint256 amount);
    event BetResolved(uint256 indexed betId, uint8 winningOption);
    event WinningsClaimed(uint256 indexed betId, address indexed user, uint256 amount);
    event RefundClaimed(uint256 indexed betId, address indexed user, uint256 amount);

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
        bet.startTime = block.timestamp;
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
     * @param _amount Amount to bet
     */
    function placeBet(uint256 _betId, uint8 _option, uint256 _amount) external payable nonReentrant {
        Bet storage bet = bets[_betId];
        require(_betId < betCounter, "Bet does not exist");
        require(block.timestamp < bet.endTime, "Betting period ended");
        require(_option < bet.options.length, "Invalid option");
        require(_amount > 0, "Must bet something");
        
        // Check if user has already bet on a different option (single option constraint)
        bool hasExistingBet = false;
        uint8 existingOption = 0;
        
        for (uint8 i = 0; i < bet.options.length; i++) {
            if (bet.userBets[msg.sender][i] > 0) {
                hasExistingBet = true;
                existingOption = i;
                break;
            }
        }
        
        if (hasExistingBet) {
            require(_option == existingOption, "Can only bet on one option per bet");
        }
        
        // Handle payment based on token type
        if (bet.token == address(0)) {
            // Native token (HYPE)
            require(msg.value == _amount, "Sent value must match bet amount");
        } else {
            // ERC20 token
            require(msg.value == 0, "Do not send native tokens for ERC20 bets");
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
        
        // Calculate pari-mutuel winnings
        uint256 totalWinningPool = bet.totalAmountPerOption[bet.winningOption];
        uint256 totalLosingPool = 0;
        
        // Sum all losing pools
        for (uint8 i = 0; i < bet.options.length; i++) {
            if (i != bet.winningOption) {
                totalLosingPool += bet.totalAmountPerOption[i];
            }
        }
        
        // Calculate final winnings: original bet + proportional share of losing pool
        uint256 winnings = userBet;
        if (totalWinningPool > 0 && totalLosingPool > 0) {
            winnings += (userBet * totalLosingPool) / totalWinningPool;
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
        
        // Refund based on token type
        if (bet.token == address(0)) {
            // Native token refund
            payable(msg.sender).transfer(totalUserBet);
        } else {
            // ERC20 token refund
            IERC20(bet.token).transfer(msg.sender, totalUserBet);
        }
        
        emit RefundClaimed(_betId, msg.sender, totalUserBet);
    }
    
    // ========== VIEW FUNCTIONS ==========
    
    /**
     * @dev Get comprehensive bet details
     * @param _betId ID of the bet
     * @return All bet information including token address
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
     * @dev Get user's bets for a specific bet
     * @param _betId ID of the bet
     * @param _user Address of the user
     * @return Array of bet amounts per option
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
     * @return Whether user has claimed
     */
    function hasUserClaimed(uint256 _betId, address _user) external view returns (bool) {
        require(_betId < betCounter, "Bet does not exist");
        return bets[_betId].hasClaimed[_user];
    }
    
    /**
     * @dev Get time remaining for betting
     * @param _betId ID of the bet
     * @return Seconds remaining (0 if ended)
     */
    function getTimeLeft(uint256 _betId) external view returns (uint256) {
        require(_betId < betCounter, "Bet does not exist");
        Bet storage bet = bets[_betId];
        
        if (block.timestamp >= bet.endTime) {
            return 0;
        }
        return bet.endTime - block.timestamp;
    }
    
    /**
     * @dev Get time remaining for resolution
     * @param _betId ID of the bet
     * @return Seconds remaining for resolution (0 if passed)
     */
    function getResolutionTimeLeft(uint256 _betId) external view returns (uint256) {
        require(_betId < betCounter, "Bet does not exist");
        Bet storage bet = bets[_betId];
        
        if (block.timestamp >= bet.resolutionDeadline) {
            return 0;
        }
        return bet.resolutionDeadline - block.timestamp;
    }
    
    /**
     * @dev Get resolution deadline timestamp
     * @param _betId ID of the bet
     * @return Resolution deadline timestamp
     */
    function getResolutionDeadline(uint256 _betId) external view returns (uint256) {
        require(_betId < betCounter, "Bet does not exist");
        return bets[_betId].resolutionDeadline;
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