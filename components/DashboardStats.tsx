"use client";

import { PlayerStatsData } from "@/hooks/usePlinko";
import { formatEther } from "viem";

interface DashboardStatsProps {
  stats: PlayerStatsData | null;
  loading: boolean;
}

export function DashboardStats({ stats, loading }: DashboardStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-[#0f1923] border border-[#1e2d3d] rounded-xl p-4 animate-pulse">
            <div className="h-3 bg-[#1e2d3d] rounded mb-3 w-2/3" />
            <div className="h-7 bg-[#1e2d3d] rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const totalGames = Number(stats.totalGames);
  const totalWins = Number(stats.totalWins);
  const winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : "0.0";
  const totalBetEth = parseFloat(formatEther(stats.totalBet)).toFixed(3);
  const netProfit = stats.totalPayout - stats.totalBet;
  const netProfitEth = parseFloat(formatEther(netProfit < 0n ? -netProfit : netProfit)).toFixed(4);
  const biggestWinEth = parseFloat(formatEther(stats.biggestWin)).toFixed(4);
  const isProfit = netProfit >= 0n;

  const cards = [
    { label: "Total Games", value: totalGames.toString(), color: "text-white" },
    { label: "Win Rate", value: `${winRate}%`, color: parseInt(winRate) >= 50 ? "text-green-400" : "text-yellow-400" },
    { label: "Total Wagered", value: `${totalBetEth} MON`, color: "text-gray-300" },
    {
      label: "Net Profit/Loss",
      value: `${isProfit ? "+" : "-"}${netProfitEth} MON`,
      color: isProfit ? "text-green-400" : "text-red-400",
    },
    { label: "Biggest Win", value: `${biggestWinEth} MON`, color: "text-[#836EF9]" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-[#0f1923] border border-[#1e2d3d] rounded-xl p-4">
          <div className="text-gray-500 text-xs mb-2">{card.label}</div>
          <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}
