"use client";

import { useWallets } from "@privy-io/react-auth";
import { formatEther } from "viem";

interface LeaderEntry {
  address: string;
  profit: bigint;
  games: bigint;
  biggestWin: bigint;
}

interface LeaderboardTableProps {
  entries: LeaderEntry[];
  loading: boolean;
}

export function LeaderboardTable({ entries, loading }: LeaderboardTableProps) {
  const { wallets } = useWallets();
  const myAddress = wallets?.[0]?.address?.toLowerCase();

  const shortAddr = (addr: string) => addr.slice(0, 6) + "..." + addr.slice(-4);

  const medals = ["🥇", "🥈", "🥉"];

  if (loading) {
    return (
      <div className="bg-[#0f1923] border border-[#1e2d3d] rounded-xl overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-[#1e2d3d] animate-pulse flex gap-4">
            <div className="h-4 bg-[#1e2d3d] rounded w-8" />
            <div className="h-4 bg-[#1e2d3d] rounded flex-1" />
            <div className="h-4 bg-[#1e2d3d] rounded w-20" />
            <div className="h-4 bg-[#1e2d3d] rounded w-20" />
            <div className="h-4 bg-[#1e2d3d] rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-[#0f1923] border border-[#1e2d3d] rounded-xl p-12 text-center text-gray-500">
        No players yet. Be the first to play!
      </div>
    );
  }

  return (
    <div className="bg-[#0f1923] border border-[#1e2d3d] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-5 px-6 py-3 bg-[#1e2d3d]/50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
        <div>Rank</div>
        <div>Player</div>
        <div className="text-right">Games</div>
        <div className="text-right">Biggest Win</div>
        <div className="text-right">Net Profit</div>
      </div>

      {entries.map((entry, i) => {
        const isMe = entry.address.toLowerCase() === myAddress;
        const profitEth = parseFloat(formatEther(entry.profit)).toFixed(4);
        const biggestWinEth = parseFloat(formatEther(entry.biggestWin)).toFixed(4);
        return (
          <div
            key={entry.address}
            className={`grid grid-cols-5 px-6 py-4 border-b border-[#1e2d3d] text-sm transition-colors ${
              isMe ? "bg-[#836EF9]/10 border-l-2 border-l-[#836EF9]" : "hover:bg-[#1e2d3d]/30"
            }`}
          >
            <div className="text-gray-400 font-medium">
              {i < 3 ? medals[i] : `#${i + 1}`}
            </div>
            <div className="font-mono">
              <span className={isMe ? "text-[#836EF9] font-bold" : "text-gray-300"}>
                {shortAddr(entry.address)}
              </span>
              {isMe && <span className="ml-2 text-xs text-[#836EF9]">(You)</span>}
            </div>
            <div className="text-right text-gray-400">{Number(entry.games)}</div>
            <div className="text-right text-yellow-400">{biggestWinEth} MON</div>
            <div className={`text-right font-bold ${entry.profit > 0n ? "text-green-400" : "text-red-400"}`}>
              {entry.profit > 0n ? "+" : ""}{profitEth} MON
            </div>
          </div>
        );
      })}
    </div>
  );
}
