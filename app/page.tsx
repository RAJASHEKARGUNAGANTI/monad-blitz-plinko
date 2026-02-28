"use client";

import { useState, useCallback, useRef } from "react";
import { BetControls } from "@/components/BetControls";
import { PlinkoBoard } from "@/components/PlinkoBoard";
import { LiveFeed } from "@/components/LiveFeed";
import { WinDisplay } from "@/components/WinDisplay";
import { usePlinko, GameResult } from "@/hooks/usePlinko";

export default function GamePage() {
  const { play, isPlaying, lastResult, error } = usePlinko();
  const [rows, setRows] = useState<8 | 12 | 16>(16);
  const [risk, setRisk] = useState<0 | 1 | 2>(1);
  const [activeBucket, setActiveBucket] = useState<number | null>(null);
  const [showResult, setShowResult] = useState<GameResult | null>(null);
  const pendingResultRef = useRef<GameResult | null>(null);
  // Mobile: controls panel collapsed by default
  const [showControls, setShowControls] = useState(false);

  const handlePlay = useCallback(
    async (bet: string, r: 8 | 12 | 16, rk: 0 | 1 | 2) => {
      setActiveBucket(null);
      setShowResult(null);
      pendingResultRef.current = null;
      // Auto-collapse controls on mobile when playing
      setShowControls(false);

      const result = await play(bet, r, rk);
      if (result) {
        pendingResultRef.current = result;
        setActiveBucket(result.bucket);
      }
    },
    [play]
  );

  const handleAnimationComplete = useCallback(() => {
    if (pendingResultRef.current) {
      setShowResult(pendingResultRef.current);
      pendingResultRef.current = null;
    }
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">

      {/* Mobile-only: toggle button for controls */}
      <button
        onClick={() => setShowControls((v) => !v)}
        className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-[#0f1923] border border-[#1e2d3d] rounded-xl text-sm text-gray-300 font-medium"
      >
        <span>⚙ Bet Controls</span>
        <span className="text-[#836EF9]">{showControls ? "▲ Hide" : "▼ Show"}</span>
      </button>

      {/* Controls — always visible on lg+, toggled on mobile */}
      <div className={`${showControls ? "block" : "hidden"} lg:block w-full lg:w-64 shrink-0`}>
        <BetControls
          onPlay={handlePlay}
          isPlaying={isPlaying}
          lastResult={lastResult}
          rows={rows}
          risk={risk}
          onRowsChange={setRows}
          onRiskChange={setRisk}
        />
      </div>

      {/* Center: Board — always visible, full width on mobile */}
      <div className="flex-1 w-full flex flex-col items-center">
        {error && (
          <div className="mb-3 w-full max-w-md bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-400 text-sm text-center">
            {error}
          </div>
        )}
        <PlinkoBoard
          rows={rows}
          risk={risk}
          activeBucket={activeBucket}
          isPlaying={isPlaying}
          onAnimationComplete={handleAnimationComplete}
        />
        <div className="mt-2 text-center text-gray-600 text-xs">
          Powered by Monad Testnet · ~1s block finality
        </div>
      </div>

      {/* Live Feed — hidden on mobile, visible on lg+ */}
      <div className="hidden lg:block shrink-0">
        <LiveFeed />
      </div>

      {/* Win/Loss popup */}
      <WinDisplay result={showResult} onClose={() => setShowResult(null)} />
    </div>
  );
}
