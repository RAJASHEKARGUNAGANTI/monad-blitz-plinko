// Multipliers stored as x100 in contract (e.g., 200 = 2.00x)
// These match exactly what's in Plinko.sol _initMultipliers()

export type Risk = 0 | 1 | 2; // 0=Low, 1=Medium, 2=High
export type Rows = 8 | 12 | 16;

export const RISK_LABELS: Record<Risk, string> = {
  0: "Low",
  1: "Medium",
  2: "High",
};

export const MULTIPLIERS: Record<Rows, Record<Risk, number[]>> = {
  8: {
    0: [55, 14, 350, 150, 73, 150, 350, 14, 55],
    1: [1300, 400, 90, 40, 9, 40, 90, 400, 1300],
    2: [2900, 600, 180, 30, 4, 30, 180, 600, 2900],
  },
  12: {
    0: [540, 180, 90, 30, 14, 8, 5, 8, 14, 30, 90, 180, 540],
    1: [4200, 600, 200, 50, 20, 6, 3, 6, 20, 50, 200, 600, 4200],
    2: [10000, 2000, 400, 80, 20, 5, 1, 5, 20, 80, 400, 2000, 10000],
  },
  16: {
    0: [1600, 500, 200, 80, 30, 14, 6, 3, 2, 3, 6, 14, 30, 80, 200, 500, 1600],
    1: [10000, 2000, 600, 150, 40, 10, 3, 1, 1, 1, 3, 10, 40, 150, 600, 2000, 10000],
    2: [100000, 13000, 2600, 900, 400, 200, 20, 20, 20, 20, 20, 200, 400, 900, 2600, 13000, 100000],
  },
};

// Display multiplier as formatted string (e.g., 200 → "2.00x")
export function formatMultiplier(raw: number): string {
  return (raw / 100).toFixed(2) + "x";
}

// Color for each bucket based on multiplier value
export function getBucketColor(raw: number): string {
  if (raw >= 10000) return "#FF0000"; // Red — huge win
  if (raw >= 1000) return "#FF4500";  // OrangeRed
  if (raw >= 500) return "#FF6B00";   // Dark Orange
  if (raw >= 200) return "#FF8C00";   // Orange
  if (raw >= 100) return "#FFA500";   // Light Orange
  if (raw >= 50) return "#FFD700";    // Gold
  if (raw >= 20) return "#9ACD32";    // Yellow-Green
  if (raw >= 5) return "#32CD32";     // Green
  return "#228B22";                   // Dark green — low multiplier
}

// Plinko ABI — only the functions we need on the frontend
export const PLINKO_ABI = [
  {
    "inputs": [
      { "internalType": "uint8", "name": "rows", "type": "uint8" },
      { "internalType": "uint8", "name": "risk", "type": "uint8" }
    ],
    "name": "play",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "stats",
    "outputs": [
      { "internalType": "uint256", "name": "totalGames", "type": "uint256" },
      { "internalType": "uint256", "name": "totalWins", "type": "uint256" },
      { "internalType": "uint256", "name": "totalBet", "type": "uint256" },
      { "internalType": "uint256", "name": "totalPayout", "type": "uint256" },
      { "internalType": "uint256", "name": "biggestWin", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "n", "type": "uint256" }],
    "name": "getLeaderboard",
    "outputs": [
      { "internalType": "address[]", "name": "addrs", "type": "address[]" },
      { "internalType": "uint256[]", "name": "profits", "type": "uint256[]" },
      { "internalType": "uint256[]", "name": "games", "type": "uint256[]" },
      { "internalType": "uint256[]", "name": "biggestWins", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPlayerCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "bet", "type": "uint256" },
      { "indexed": false, "internalType": "uint8", "name": "rows", "type": "uint8" },
      { "indexed": false, "internalType": "uint8", "name": "risk", "type": "uint8" },
      { "indexed": false, "internalType": "uint256", "name": "bucket", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "multiplier", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "payout", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "BallDropped",
    "type": "event"
  }
] as const;
