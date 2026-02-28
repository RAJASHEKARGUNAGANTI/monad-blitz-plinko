"use client";

import { useEffect, useState, useCallback } from "react";
import { usePlinko, LiveFeedEntry } from "@/hooks/usePlinko";
import { formatMultiplier } from "@/constants/multipliers";
import { formatEther } from "viem";

export function LiveFeed() {
  const { getLiveFeed } = usePlinko();
  const [entries, setEntries] = useState<LiveFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async () => {
    const data = await getLiveFeed(20);
    setEntries(data);
    setLoading(false);
  }, [getLiveFeed]);

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, [fetchFeed]);

  const shortAddr = (addr: string) => addr.slice(0, 6) + "..." + addr.slice(-4);

  return (
    <div className="w-56 bg-[#0f1923] border border-[#1e2d3d] rounded-xl overflow-hidden flex flex-col">
      <div className="px-3 py-2 border-b border-[#1e2d3d]">
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Live Bets</h3>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[420px]">
        {loading ? (
          <div className="p-4 text-center text-gray-500 text-xs">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-xs">No bets yet. Be the first!</div>
        ) : (
          <div className="divide-y divide-[#1e2d3d]">
            {entries.map((e, i) => {
              const won = e.payout > e.bet;
              const profit = won ? e.payout - e.bet : e.bet - e.payout;
              return (
                <div key={i} className="px-3 py-2 hover:bg-[#1e2d3d]/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs font-mono">{shortAddr(e.player)}</span>
                    <span className={`text-xs font-bold ${won ? "text-green-400" : "text-red-400"}`}>
                      {formatMultiplier(e.multiplier)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-gray-500 text-xs">{parseFloat(formatEther(e.bet)).toFixed(3)} MON</span>
                    <span className={`text-xs ${won ? "text-green-400/70" : "text-red-400/70"}`}>
                      {won ? "+" : "-"}{parseFloat(formatEther(profit)).toFixed(3)}
                    </span>
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
