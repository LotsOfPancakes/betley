// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IERC20.sol";

contract Betley {
    IERC20 public immutable hypeToken;
    
    struct Bet {
        string name;
        string[] options; // Dynamic array for 2-4 options
        address creator;
        uint256 endTime;
        uint256 resolutionDeadline;
        bool resolved;
        uint8 winningOption;
        mapping(uint8 => uint256) totalAmountPerOption;
        mapping(address => mapping(uint8 => uint256)) userBets;
        mapping(address => bool) hasClaimed;
    }

    mapping(uint256 => Bet) public bets;
    uint256 public betCounter;

    event BetCreated(uint256 indexed betId, string name, address creator);
    event BetPlaced(uint256 indexed betId, address user, uint8 option, uint256 amount);
    event BetResolved(uint256 indexed betId, uint8 winningOption);
    event WinningsClaimed(uint256 indexed betId, address user, uint256 amount);

    constructor(address _hypeToken) {
        hypeToken = IERC20(_hypeToken);
    }

    function createBet(
        string memory _name,
        string[] memory _options,
        uint256 _duration
    ) external returns (uint256) {
        require(_options.length >= 2 && _options.length <= 4, "Must have 2-4 options");
        require(_duration > 0, "Duration must be positive");

        uint256 betId = betCounter++;
        Bet storage newBet = bets[betId];
        
        newBet.name = _name;
        newBet.creator = msg.sender;
        newBet.endTime = block.timestamp + _duration;
        newBet.resolutionDeadline = newBet.endTime + 72 hours;
        
        // Store options
        for (uint8 i = 0; i < _options.length; i++) {
            newBet.options.push(_options[i]);
        }

        emit BetCreated(betId, _name, msg.sender);
        return betId;
    }

    function placeBet(uint256 _betId, uint8 _option, uint256 _amount) external {
        Bet storage bet = bets[_betId];
        require(block.timestamp < bet.endTime, "Betting ended");
        require(_option < bet.options.length, "Invalid option");
        require(_amount > 0, "Must bet something");

        // Check if user has already bet on a different option
        bool hasExistingBet = false;
        uint8 existingOption = 0;
        
        for (uint8 i = 0; i < bet.options.length; i++) {
            if (bet.userBets[msg.sender][i] > 0) {
                hasExistingBet = true;
                existingOption = i;
                break;
            }
        }
        
        // If user has bet before, ensure they're betting on the same option
        if (hasExistingBet) {
            require(_option == existingOption, "Can only bet on one option per bet");
        }

        // Transfer HYPE tokens from user to contract
        require(hypeToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        bet.totalAmountPerOption[_option] += _amount;
        bet.userBets[msg.sender][_option] += _amount;

        emit BetPlaced(_betId, msg.sender, _option, _amount);
    }

    function resolveBet(uint256 _betId, uint8 _winningOption) external {
        Bet storage bet = bets[_betId];
        require(msg.sender == bet.creator, "Only creator can resolve");
        require(block.timestamp >= bet.endTime, "Betting not ended");
        require(block.timestamp < bet.resolutionDeadline, "Resolution deadline passed");
        require(!bet.resolved, "Already resolved");
        require(_winningOption < bet.options.length, "Invalid option");

        bet.resolved = true;
        bet.winningOption = _winningOption;

        emit BetResolved(_betId, _winningOption);
    }

    function claimWinnings(uint256 _betId) external {
        Bet storage bet = bets[_betId];
        
        // If resolution deadline passed and bet not resolved, allow users to claim their original bets
        if (block.timestamp >= bet.resolutionDeadline && !bet.resolved) {
            uint256 totalUserBet = 0;
            for (uint8 i = 0; i < bet.options.length; i++) {
                totalUserBet += bet.userBets[msg.sender][i];
            }
            require(totalUserBet > 0, "No bet to claim");
            require(!bet.hasClaimed[msg.sender], "Already claimed");
            
            bet.hasClaimed[msg.sender] = true;
            
            // Refund original bet amount
            require(hypeToken.transfer(msg.sender, totalUserBet), "Transfer failed");
            
            emit WinningsClaimed(_betId, msg.sender, totalUserBet);
            return;
        }
        
        // Normal winning claim flow
        require(bet.resolved, "Bet not resolved");
        require(!bet.hasClaimed[msg.sender], "Already claimed");

        uint256 userWinningBet = bet.userBets[msg.sender][bet.winningOption];
        require(userWinningBet > 0, "No winning bet");

        bet.hasClaimed[msg.sender] = true;

        uint256 totalWinningPool = bet.totalAmountPerOption[bet.winningOption];
        uint256 totalLosingPool = 0;

        for (uint8 i = 0; i < bet.options.length; i++) {
            if (i != bet.winningOption) {
                totalLosingPool += bet.totalAmountPerOption[i];
            }
        }

        // Calculate winnings: original bet + proportional share of losing pool
        uint256 winnings;
        if (totalLosingPool == 0) {
            // No losers, just return original bet
            winnings = userWinningBet;
        } else {
            winnings = userWinningBet + (userWinningBet * totalLosingPool / totalWinningPool);
        }
        
        // Transfer HYPE tokens to winner
        require(hypeToken.transfer(msg.sender, winnings), "Transfer failed");

        emit WinningsClaimed(_betId, msg.sender, winnings);
    }

    // View functions
    function getBetDetails(uint256 _betId) external view returns (
        string memory name,
        string[] memory options,
        address creator,
        uint256 endTime,
        bool resolved,
        uint8 winningOption,
        uint256[] memory totalAmounts
    ) {
        Bet storage bet = bets[_betId];
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

    function getUserBets(uint256 _betId, address _user) external view returns (uint256[] memory) {
        Bet storage bet = bets[_betId];
        uint256[] memory userAmounts = new uint256[](bet.options.length);
        
        for (uint8 i = 0; i < bet.options.length; i++) {
            userAmounts[i] = bet.userBets[_user][i];
        }
        return userAmounts;
    }

    function hasUserClaimed(uint256 _betId, address _user) external view returns (bool) {
        return bets[_betId].hasClaimed[_user];
    }

    function getResolutionDeadline(uint256 _betId) external view returns (uint256) {
        return bets[_betId].resolutionDeadline;
    }
}