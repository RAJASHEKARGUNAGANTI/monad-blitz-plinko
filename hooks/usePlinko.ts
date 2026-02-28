"use client";

import { useState, useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";
import { createWalletClient, createPublicClient, custom, http, parseEther, formatEther } from "viem";
import { monadTestnet } from "@/config/chain";
import { PLINKO_ABI } from "@/constants/multipliers";

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http("https://testnet-rpc.monad.xyz"),
});

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export interface GameResult {
  bucket: number;
  multiplier: number; // raw x100
  bet: bigint;
  payout: bigint;
  txHash: string;
  rows: number;
  risk: number;
}

export interface LiveFeedEntry {
  player: string;
  bet: bigint;
  rows: number;
  risk: number;
  bucket: number;
  multiplier: number;
  payout: bigint;
  timestamp: number;
  txHash?: string;
}

export interface PlayerStatsData {
  totalGames: bigint;
  totalWins: bigint;
  totalBet: bigint;
  totalPayout: bigint;
  biggestWin: bigint;
}

export function usePlinko() {
  const { wallets } = useWallets();
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const play = useCallback(
    async (betAmountEth: string, rows: 8 | 12 | 16, risk: 0 | 1 | 2) => {
      setError(null);
      setLastResult(null);

      if (!wallets || wallets.length === 0) {
        setError("Please connect your wallet first.");
        return null;
      }

      // Prefer MetaMask / external wallet over Privy embedded wallet
      const wallet =
        wallets.find((w) => w.walletClientType !== "privy") ?? wallets[0];
      setIsPlaying(true);

      try {
        // Switch MetaMask to Monad Testnet if it's on the wrong chain
        await wallet.switchChain(monadTestnet.id);

        const provider = await wallet.getEthereumProvider();
        const walletClient = createWalletClient({
          chain: monadTestnet,
          transport: custom(provider),
        });

        const [address] = await walletClient.getAddresses();
        const betWei = parseEther(betAmountEth);

        // Send transaction
        const txHash = await walletClient.writeContract({
          address: CONTRACT_ADDRESS,
          abi: PLINKO_ABI,
          functionName: "play",
          args: [rows, risk],
          value: betWei,
          account: address,
        });

        // Wait for receipt
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

        // Check if transaction was reverted on-chain
        if (receipt.status === "reverted") {
          throw new Error("Transaction reverted. Check contract has enough MON, or try a smaller bet.");
        }

        // Fetch and decode BallDropped event from the exact tx block
        const events = await publicClient.getContractEvents({
          address: CONTRACT_ADDRESS,
          abi: PLINKO_ABI,
          eventName: "BallDropped",
          fromBlock: receipt.blockNumber,
          toBlock: receipt.blockNumber,
        });

        // Match by txHash first (most reliable), fall back to player address
        const myEvent =
          events.find((e) => e.transactionHash === txHash) ??
          events.find((e) => e.args.player?.toLowerCase() === address.toLowerCase());

        if (!myEvent || !myEvent.args) {
          throw new Error("Game played but result not found. Check the explorer: https://testnet.monadexplorer.com/tx/" + txHash);
        }

        const result: GameResult = {
          bucket: Number(myEvent.args.bucket),
          multiplier: Number(myEvent.args.multiplier),
          bet: myEvent.args.bet!,
          payout: myEvent.args.payout!,
          txHash,
          rows,
          risk,
        };

        setLastResult(result);
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Transaction failed";
        setError(msg.includes("User rejected") ? "Transaction cancelled." : msg);
        return null;
      } finally {
        setIsPlaying(false);
      }
    },
    [wallets]
  );

  const getPlayerStats = useCallback(
    async (address: `0x${string}`): Promise<PlayerStatsData | null> => {
      if (!CONTRACT_ADDRESS) return null;
      try {
        const result = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: PLINKO_ABI,
          functionName: "stats",
          args: [address],
        });
        const [totalGames, totalWins, totalBet, totalPayout, biggestWin] = result as unknown as bigint[];
        return { totalGames, totalWins, totalBet, totalPayout, biggestWin };
      } catch {
        return null;
      }
    },
    []
  );

  const getLeaderboard = useCallback(
    async (n = 10) => {
      if (!CONTRACT_ADDRESS) return null;
      try {
        const result = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: PLINKO_ABI,
          functionName: "getLeaderboard",
          args: [BigInt(n)],
        });
        const [addrs, profits, games, biggestWins] = result as [string[], bigint[], bigint[], bigint[]];
        return addrs.map((addr, i) => ({
          address: addr,
          profit: profits[i],
          games: games[i],
          biggestWin: biggestWins[i],
        }));
      } catch {
        return null;
      }
    },
    []
  );

  const getLiveFeed = useCallback(
    async (count = 20): Promise<LiveFeedEntry[]> => {
      if (!CONTRACT_ADDRESS) return [];
      try {
        const latestBlock = await publicClient.getBlockNumber();
        // Keep range small (100 blocks) to stay under Monad public RPC size limits
        const fromBlock = latestBlock > 100n ? latestBlock - 100n : 0n;

        const events = await publicClient.getContractEvents({
          address: CONTRACT_ADDRESS,
          abi: PLINKO_ABI,
          eventName: "BallDropped",
          fromBlock,
          toBlock: latestBlock,
        });

        return events
          .slice(-count)
          .reverse()
          .map((e) => ({
            player: e.args.player as string,
            bet: e.args.bet as bigint,
            rows: Number(e.args.rows),
            risk: Number(e.args.risk),
            bucket: Number(e.args.bucket),
            multiplier: Number(e.args.multiplier),
            payout: e.args.payout as bigint,
            timestamp: Number(e.args.timestamp),
            txHash: e.transactionHash ?? undefined,
          }));
      } catch {
        return [];
      }
    },
    []
  );

  const getGameHistory = useCallback(
    async (playerAddress: `0x${string}`, count = 50): Promise<LiveFeedEntry[]> => {
      if (!CONTRACT_ADDRESS) return [];
      try {
        // player is indexed so the node filters server-side — fromBlock: 0n is safe
        const events = await publicClient.getContractEvents({
          address: CONTRACT_ADDRESS,
          abi: PLINKO_ABI,
          eventName: "BallDropped",
          args: { player: playerAddress },
          fromBlock: 0n,
        });

        return events
          .slice(-count)
          .reverse()
          .map((e) => ({
            player: e.args.player as string,
            bet: e.args.bet as bigint,
            rows: Number(e.args.rows),
            risk: Number(e.args.risk),
            bucket: Number(e.args.bucket),
            multiplier: Number(e.args.multiplier),
            payout: e.args.payout as bigint,
            timestamp: Number(e.args.timestamp),
            txHash: e.transactionHash ?? undefined,
          }));
      } catch {
        return [];
      }
    },
    []
  );

  return {
    play,
    isPlaying,
    lastResult,
    error,
    getPlayerStats,
    getLeaderboard,
    getLiveFeed,
    getGameHistory,
    formatEther,
  };
}

