# Monad Plinko

An on-chain Plinko game built for the **Monad Blitz Hackathon**. Drop balls through a peg grid, win MON tokens, and see results settle in ~1 second thanks to Monad's fast finality.

Live on **Monad Testnet** — no centralized server, all outcomes decided on-chain.

---

## What It Does

| Feature | Details |
|---|---|
| **Plinko board** | 8, 12, or 16 row grid rendered with HTML5 Canvas, animated ball drop |
| **On-chain randomness** | Uses `prevrandao` + player nonce — provably fair, no server |
| **Multipliers** | Bell-curve payouts: edges = high risk/reward, center = safe |
| **3 risk levels** | Low / Medium / High — different payout tables |
| **Live feed** | Real-time list of all players' bets from on-chain events |
| **Dashboard** | Your stats: games, win rate, total wagered, net profit, game history |
| **Leaderboard** | Top players ranked by profit, biggest win, most games |
| **Confetti** | Fires on wins ≥ 10x |
| **Mobile** | Responsive layout with collapsible controls and hamburger nav |

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS |
| Wallet Auth | Privy v3 (`@privy-io/react-auth`) |
| Web3 Client | Viem + Wagmi |
| Smart Contract | Solidity 0.8.20 |
| Contract Dev | Hardhat v2 (in `contracts-workspace/`) |
| Chain | Monad Testnet — Chain ID: 10143 |

---

## Project Structure

```
monad-plinko/
├── app/
│   ├── layout.tsx              ← Root layout (fonts, ClientLayout wrapper)
│   ├── page.tsx                ← Main game page (board + controls + live feed)
│   ├── dashboard/page.tsx      ← Player stats and game history
│   └── leaderboard/page.tsx    ← Global leaderboard
├── components/
│   ├── ClientLayout.tsx        ← SSR-safe Privy/Wagmi wrapper (next/dynamic ssr:false)
│   ├── Navbar.tsx              ← Nav links + wallet info + mobile hamburger
│   ├── PlinkoBoard.tsx         ← Canvas-based animated peg board
│   ├── BetControls.tsx         ← Bet amount, rows, risk, drop button
│   ├── WinDisplay.tsx          ← Result popup with confetti on big wins
│   ├── LiveFeed.tsx            ← Live list of all recent bets
│   ├── DashboardStats.tsx      ← Stat cards for dashboard
│   └── LeaderboardTable.tsx    ← Ranked player table
├── config/
│   ├── chain.ts                ← Monad Testnet viem chain definition
│   └── providers.tsx           ← Privy + Wagmi + QueryClient providers
├── constants/
│   └── multipliers.ts          ← Payout tables (x100) + ABI + helpers
├── hooks/
│   └── usePlinko.ts            ← All contract read/write/event logic
├── contracts-workspace/        ← Hardhat project (separate from Next.js)
│   ├── contracts/Plinko.sol    ← The smart contract
│   ├── hardhat.config.cjs      ← Monad Testnet config
│   └── scripts/deploy.cjs      ← Deployment script
└── .env.local                  ← API keys and contract address (never commit)
```

---

## Prerequisites

- **Node.js v18+** — [nodejs.org](https://nodejs.org)
- **MetaMask** browser extension — [metamask.io](https://metamask.io)
- **Monad Testnet MON** — get free tokens from the faucet (see below)
- **Privy account** — free at [dashboard.privy.io](https://dashboard.privy.io)

---

## First-Time Setup

### Step 1 — Clone and install

```bash
git clone <repo-url>
cd monad-plinko
npm install
```

### Step 2 — Add Monad Testnet to MetaMask

In MetaMask → Settings → Networks → Add Network:

| Field | Value |
|---|---|
| Network Name | Monad Testnet |
| RPC URL | `https://testnet-rpc.monad.xyz` |
| Chain ID | `10143` |
| Currency Symbol | `MON` |
| Block Explorer | `https://testnet.monadexplorer.com` |

### Step 3 — Get free testnet MON

Go to [https://faucet.monad.xyz](https://faucet.monad.xyz) and request MON for your MetaMask address.

You need at least **0.2 MON**:
- 0.1 MON to fund the contract (house balance)
- Some for your own bets and gas fees

### Step 4 — Get a Privy App ID

1. Go to [https://dashboard.privy.io](https://dashboard.privy.io)
2. Sign up for free and create an app
3. Copy the **App ID** (looks like `cmm6351sz...`)

### Step 5 — Configure `.env.local`

Create a file called `.env.local` in the project root:

```env
# Privy App ID from dashboard.privy.io
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Filled in after deploying the contract (Step 6)
NEXT_PUBLIC_CONTRACT_ADDRESS=

# Your MetaMask private key (for deploying the contract only)
# MetaMask → Account Details → Export Private Key
# NEVER share or commit this!
PRIVATE_KEY=your_metamask_private_key_here
```

---

## Deploying the Smart Contract

The contract lives in `contracts-workspace/` — a separate Hardhat project to avoid ESM conflicts with Next.js.

### Step 6 — Install contract dependencies

```bash
cd contracts-workspace
npm install
```

### Step 7 — Compile the contract

```bash
npm run compile
```

Expected output:
```
Compiled 1 Solidity file successfully
```

### Step 8 — Deploy to Monad Testnet

```bash
npm run deploy
```

Expected output:
```
Deploying Plinko with account: 0xYourAddress
Account balance: 0.500 MON

✅ Plinko deployed to: 0xNewContractAddress
   Contract balance: 0.1 MON

👉 Copy this into your ../.env.local:
   NEXT_PUBLIC_CONTRACT_ADDRESS=0xNewContractAddress

🔍 View on explorer: https://testnet.monadexplorer.com/address/0xNewContractAddress
```

### Step 9 — Update `.env.local`

Copy the deployed address and paste it in `.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xNewContractAddress
```

Go back to the project root:
```bash
cd ..
```

---

## Running the Frontend

### Step 10 — Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 11 — Connect your wallet

- Click **Connect Wallet** in the top-right
- Select **MetaMask** (or email/Google to create an embedded wallet)
- Approve the Monad Testnet network switch if prompted

### Step 12 — Play

1. Set your **Bet Amount** (0.001 – 1 MON)
2. Choose **Rows** (8 / 12 / 16) — more rows = more pegs
3. Choose **Risk** (Low / Medium / High) — affects payout distribution
4. Click **Drop Ball**
5. Approve the MetaMask transaction
6. Watch the ball animate (~1 second for Monad to confirm)
7. Win display appears after the ball lands

---

## Pages

| URL | Page | Description |
|---|---|---|
| `/` | Game | Main Plinko board + bet controls + live feed |
| `/dashboard` | Dashboard | Your stats, win rate, profit, full game history |
| `/leaderboard` | Leaderboard | Top players by profit, biggest win, or most games |

---

## Multiplier Tables

Multipliers are stored in the contract as × 100 (so `200` = 2.00×). The bucket index is the number of right-moves the ball makes.

**16 rows, Medium risk (example):**
```
[10000, 2000, 600, 150, 40, 10, 3, 1, 1, 1, 3, 10, 40, 150, 600, 2000, 10000]
  ^                                                                          ^
 Edges = 100×                                                    Center = 0.01×
```

A win ≥ 10× (multiplier value ≥ 1000) triggers the confetti burst.

---

## Contract Functions

| Function | Who | Description |
|---|---|---|
| `play(rows, risk)` | Anyone | Drop a ball, send MON as bet |
| `stats(address)` | Anyone | Get a player's game stats |
| `getLeaderboard(n)` | Anyone | Top N players by profit |
| `getPlayerCount()` | Anyone | Total number of unique players |
| `deposit()` | Owner only | Add MON to house balance |
| `withdraw(amount)` | Owner only | Withdraw MON from house balance |
| `getContractBalance()` | Anyone | Current house balance |

---

## Funding the Contract (House Balance)

The contract needs MON to pay out wins. The deploy script seeds it with 0.1 MON automatically.

If the house runs low, fund it via MetaMask by sending MON directly to the contract address, or call `deposit()` from the owner address:

```bash
# From contracts-workspace — example using Hardhat console
npx hardhat --config hardhat.config.cjs console --network monadTestnet
> const plinko = await ethers.getContractAt("Plinko", "0xYourContractAddress")
> await plinko.deposit({ value: ethers.parseEther("1.0") })
```

Check current balance:
```
> ethers.formatEther(await plinko.getContractBalance())
```

---

## Building for Production

```bash
npm run build
npm run start
```

Or deploy to Vercel (recommended):
1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Add the three env vars from `.env.local` in the Vercel dashboard (omit `PRIVATE_KEY`)
4. Deploy

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Yes | From [dashboard.privy.io](https://dashboard.privy.io) |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Yes | Your deployed `Plinko.sol` address |
| `PRIVATE_KEY` | Deploy only | MetaMask private key — never expose this publicly |

---

## Common Issues

**"Transaction reverted" error**
- The house balance is too low to pay out the win
- Fund the contract with more MON (see Funding section above)
- Try a smaller bet amount

**"Add funds on Monad Testnet" prompt in Privy**
- Privy created an embedded wallet instead of using MetaMask
- Click "Connect Wallet" again and select MetaMask specifically
- Or use the login method "Wallet" at the top of the login screen

**"Could not parse game result"**
- Usually means the transaction reverted on-chain
- Check the contract balance and try again

**Chain ID mismatch error**
- MetaMask is on the wrong network (e.g., Ethereum mainnet)
- The app will auto-switch — just approve the network change in MetaMask

**Game History is empty**
- Make sure you're connected with MetaMask (not the Privy embedded wallet)
- History is loaded from on-chain events; wait a few seconds after playing

**413 error in Live Feed**
- The RPC block range limit was hit
- This is handled automatically — live feed uses the last 100 blocks only

---

## Useful Links

| Resource | URL |
|---|---|
| Monad Faucet | [https://faucet.monad.xyz](https://faucet.monad.xyz) |
| Monad Explorer | [https://testnet.monadexplorer.com](https://testnet.monadexplorer.com) |
| Privy Dashboard | [https://dashboard.privy.io](https://dashboard.privy.io) |
| Monad Docs | [https://docs.monad.xyz](https://docs.monad.xyz) |
| Privy Docs | [https://docs.privy.io](https://docs.privy.io) |
