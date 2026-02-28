"use client";

import { useEffect, useState, useCallback } from "react";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { usePlinko } from "@/hooks/usePlinko";

interface LeaderEntry {
  address: string;
  profit: bigint;
  games: bigint;
  biggestWin: bigint;
}

export default function LeaderboardPage() {
  const { getLeaderboard } = usePlinko();
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    const data = await getLeaderboard(20);
    if (data) {
      setEntries(
        data.map((d) => ({
          address: d.address,
          profit: d.profit,
          games: d.games,
          biggestWin: d.biggestWin,
        }))
      );
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, [getLeaderboard]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-gray-500 text-sm mt-1">Top 20 players by net profit on Monad Testnet</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-gray-600 text-xs">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="px-4 py-2 bg-[#836EF9] hover:bg-[#6d58d9] disabled:bg-[#1e2d3d] text-white text-sm rounded-lg transition-colors font-medium"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0f1923] border border-[#1e2d3d] rounded-xl p-4">
          <div className="text-gray-500 text-xs mb-1">Total Players</div>
          <div className="text-white text-xl font-bold">{entries.length}</div>
        </div>
        <div className="bg-[#0f1923] border border-[#1e2d3d] rounded-xl p-4">
          <div className="text-gray-500 text-xs mb-1">Total Games Played</div>
          <div className="text-white text-xl font-bold">
            {entries.reduce((sum, e) => sum + Number(e.games), 0)}
          </div>
        </div>
        <div className="bg-[#0f1923] border border-[#1e2d3d] rounded-xl p-4">
          <div className="text-gray-500 text-xs mb-1">Biggest Win Ever</div>
          <div className="text-[#836EF9] text-xl font-bold">
            {entries.length > 0
              ? parseFloat(
                  (Number(entries.reduce((max, e) => (e.biggestWin > max ? e.biggestWin : max), 0n)) / 1e18).toString()
                ).toFixed(4) + " MON"
              : "—"}
          </div>
        </div>
      </div>

      <LeaderboardTable entries={entries} loading={loading} />
    </div>
  );
}
