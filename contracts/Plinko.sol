// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Plinko {
    address public owner;

    struct PlayerStats {
        uint256 totalGames;
        uint256 totalWins;
        uint256 totalBet;
        uint256 totalPayout;
        uint256 biggestWin;
    }

    mapping(address => PlayerStats) public stats;
    address[] public players;

    // multipliers[rows][risk][bucket] stored as x100 (e.g. 200 = 2.00x)
    mapping(uint8 => mapping(uint8 => uint256[])) public multipliers;

    event BallDropped(
        address indexed player,
        uint256 bet,
        uint8 rows,
        uint8 risk,
        uint256 bucket,
        uint256 multiplier,
        uint256 payout,
        uint256 timestamp
    );

    event Deposited(address indexed from, uint256 amount);

    constructor() payable {
        owner = msg.sender;
        _initMultipliers();
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ─── Game ────────────────────────────────────────────────────────────────

    function play(uint8 rows, uint8 risk) external payable {
        require(msg.value >= 0.001 ether, "Min bet 0.001 MON");
        require(msg.value <= 1 ether, "Max bet 1 MON");
        require(rows == 8 || rows == 12 || rows == 16, "Rows: 8, 12 or 16");
        require(risk <= 2, "Risk: 0=Low 1=Med 2=High");
        // House pays what it can — if balance is low, payout is skipped (conditional below)

        // Track new players
        if (stats[msg.sender].totalGames == 0) {
            players.push(msg.sender);
        }

        // Provably fair randomness for hackathon (prevrandao + player nonce)
        bytes32 rand = keccak256(
            abi.encodePacked(
                block.prevrandao,
                msg.sender,
                block.number,
                stats[msg.sender].totalGames
            )
        );

        // Simulate ball path: count right-moves in first `rows` bits
        uint256 bucket = 0;
        for (uint8 i = 0; i < rows; i++) {
            if (uint256(rand) & (1 << i) != 0) {
                bucket++;
            }
        }

        uint256 multiplier = multipliers[rows][risk][bucket]; // x100
        uint256 payout = (msg.value * multiplier) / 100;

        // Update stats
        PlayerStats storage s = stats[msg.sender];
        s.totalGames++;
        s.totalBet += msg.value;
        s.totalPayout += payout;
        if (payout > msg.value) {
            s.totalWins++;
            uint256 profit = payout - msg.value;
            if (profit > s.biggestWin) {
                s.biggestWin = profit;
            }
        }

        emit BallDropped(
            msg.sender,
            msg.value,
            rows,
            risk,
            bucket,
            multiplier,
            payout,
            block.timestamp
        );

        if (payout > 0 && address(this).balance >= payout) {
            payable(msg.sender).transfer(payout);
        }
    }

    // ─── Leaderboard ─────────────────────────────────────────────────────────

    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }

    // Returns top `n` players by net profit (totalPayout - totalBet)
    function getLeaderboard(uint256 n)
        external
        view
        returns (
            address[] memory addrs,
            uint256[] memory profits,
            uint256[] memory games,
            uint256[] memory biggestWins
        )
    {
        uint256 total = players.length;
        if (n > total) n = total;

        // Copy all players + compute profits
        address[] memory tempAddrs = new address[](total);
        uint256[] memory tempProfits = new uint256[](total);

        for (uint256 i = 0; i < total; i++) {
            tempAddrs[i] = players[i];
            PlayerStats storage s = stats[players[i]];
            tempProfits[i] = s.totalPayout > s.totalBet
                ? s.totalPayout - s.totalBet
                : 0;
        }

        // Bubble sort descending by profit (fine for small leaderboards)
        for (uint256 i = 0; i < total - 1; i++) {
            for (uint256 j = 0; j < total - i - 1; j++) {
                if (tempProfits[j] < tempProfits[j + 1]) {
                    uint256 tp = tempProfits[j];
                    tempProfits[j] = tempProfits[j + 1];
                    tempProfits[j + 1] = tp;
                    address ta = tempAddrs[j];
                    tempAddrs[j] = tempAddrs[j + 1];
                    tempAddrs[j + 1] = ta;
                }
            }
        }

        addrs = new address[](n);
        profits = new uint256[](n);
        games = new uint256[](n);
        biggestWins = new uint256[](n);

        for (uint256 i = 0; i < n; i++) {
            addrs[i] = tempAddrs[i];
            profits[i] = tempProfits[i];
            games[i] = stats[tempAddrs[i]].totalGames;
            biggestWins[i] = stats[tempAddrs[i]].biggestWin;
        }
    }

    // ─── Owner ────────────────────────────────────────────────────────────────

    function deposit() external payable onlyOwner {
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner).transfer(amount);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ─── Multiplier Init ─────────────────────────────────────────────────────

    function _initMultipliers() internal {
        // 8 rows ─ 9 buckets (0..8)
        // Low risk
        multipliers[8][0] = [55, 14, 350, 150, 73, 150, 350, 14, 55];
        // Medium risk
        multipliers[8][1] = [1300, 400, 90, 40, 9, 40, 90, 400, 1300];
        // High risk
        multipliers[8][2] = [2900, 600, 180, 30, 4, 30, 180, 600, 2900];

        // 12 rows ─ 13 buckets (0..12)
        // Low risk
        multipliers[12][0] = [540, 180, 90, 30, 14, 8, 5, 8, 14, 30, 90, 180, 540];
        // Medium risk
        multipliers[12][1] = [4200, 600, 200, 50, 20, 6, 3, 6, 20, 50, 200, 600, 4200];
        // High risk
        multipliers[12][2] = [10000, 2000, 400, 80, 20, 5, 1, 5, 20, 80, 400, 2000, 10000];

        // 16 rows ─ 17 buckets (0..16)
        // Low risk
        multipliers[16][0] = [1600, 500, 200, 80, 30, 14, 6, 3, 2, 3, 6, 14, 30, 80, 200, 500, 1600];
        // Medium risk
        multipliers[16][1] = [10000, 2000, 600, 150, 40, 10, 3, 1, 1, 1, 3, 10, 40, 150, 600, 2000, 10000];
        // High risk
        multipliers[16][2] = [100000, 13000, 2600, 900, 400, 200, 20, 20, 20, 20, 20, 200, 400, 900, 2600, 13000, 100000];
    }
}
