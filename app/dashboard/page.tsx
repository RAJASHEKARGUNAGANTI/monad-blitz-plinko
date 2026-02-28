"use client";

import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { DashboardStats } from "@/components/DashboardStats";
import { usePlinko, PlayerStatsData, LiveFeedEntry } from "@/hooks/usePlinko";
import { formatMultiplier, RISK_LABELS } from "@/constants/multipliers";
import { formatEther } from "viem";

export default function DashboardPage() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();
  const { getPlayerStats, getGameHistory } = usePlinko();

  const [stats, setStats] = useState<PlayerStatsData | null>(null);
  const [history, setHistory] = useState<LiveFeedEntry[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const address = wallets?.[0]?.address as `0x${string}` | undefined;

  useEffect(() => {
    if (!authenticated) {
      router.push("/");
    }
  }, [authenticated, router]);

  useEffect(() => {
    if (!address) return;
    setLoadingStats(true);
    getPlayerStats(address).then((s) => {
      setStats(s);
      setLoadingStats(false);
    });
    setLoadingHistory(true);
    getGameHistory(address, 50).then((h) => {
      setHistory(h);
      setLoadingHistory(false);
    });
  }, [address, getPlayerStats, getGameHistory]);

  if (!authenticated) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Your Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {address ? address.slice(0, 6) + "..." + address.slice(-4) : ""}
        </p>
      </div>

      {/* Stats */}
      <DashboardStats stats={stats} loading={loadingStats} />

      {/* Game History */}
      <div className="bg-[#0f1923] border border-[#1e2d3d] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1e2d3d]">
          <h2 className="text-white font-semibold">Game History</h2>
          <p className="text-gray-500 text-xs mt-0.5">Last 50 games</p>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-7 px-6 py-3 bg-[#1e2d3d]/50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
          <div>Time</div>
          <div className="text-right">Bet</div>
          <div className="text-right">Rows</div>
          <div className="text-right">Risk</div>
          <div className="text-right">Multiplier</div>
          <div className="text-right">Payout</div>
          <div className="text-right">Result</div>
        </div>

        {loadingHistory ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No games yet. <a href="/" className="text-[#836EF9] hover:underline">Go play!</a>
          </div>
        ) : (
          <div className="divide-y divide-[#1e2d3d]">
            {history.map((entry, i) => {
              const won = entry.payout > entry.bet;
              const profit = won ? entry.payout - entry.bet : entry.bet - entry.payout;
              const date = new Date(entry.timestamp * 1000);
              return (
                <div key={i} className="grid grid-cols-7 px-6 py-3 text-sm hover:bg-[#1e2d3d]/30 transition-colors">
                  <div className="text-gray-500 text-xs">
                    {date.toLocaleTimeString()}
                  </div>
                  <div className="text-right text-gray-300">
                    {parseFloat(formatEther(entry.bet)).toFixed(3)}
                  </div>
                  <div className="text-right text-gray-400">{entry.rows}</div>
                  <div className="text-right text-gray-400">
                    {RISK_LABELS[entry.risk as 0 | 1 | 2]}
                  </div>
                  <div className="text-right text-gray-300 font-mono">
                    {formatMultiplier(entry.multiplier)}
                  </div>
                  <div className="text-right text-gray-300">
                    {parseFloat(formatEther(entry.payout)).toFixed(3)}
                  </div>
                  <div className={`text-right font-semibold ${won ? "text-green-400" : "text-red-400"}`}>
                    {won ? "+" : "-"}{parseFloat(formatEther(profit)).toFixed(4)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
