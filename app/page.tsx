"use client";

import { useState, useCallback, useRef } from "react";
import { BetControls } from "@/components/BetControls";
import { PlinkoBoard } from "@/components/PlinkoBoard";
import { LiveFeed } from "@/components/LiveFeed";
import { WinDisplay } from "@/components/WinDisplay";
import { usePlinko, GameResult } from "@/hooks/usePlinko";

export default function GamePage() {
  const { play, isPlaying, lastResult, error } = usePlinko();
  // rows and risk live here so both BetControls and PlinkoBoard stay in sync
  const [rows, setRows] = useState<8 | 12 | 16>(16);
  const [risk, setRisk] = useState<0 | 1 | 2>(1);
  const [activeBucket, setActiveBucket] = useState<number | null>(null);
  const [showResult, setShowResult] = useState<GameResult | null>(null);
  const pendingResultRef = useRef<GameResult | null>(null);

  const handlePlay = useCallback(
    async (bet: string, r: 8 | 12 | 16, rk: 0 | 1 | 2) => {
      setActiveBucket(null);
      setShowResult(null);
      pendingResultRef.current = null;

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
    <div className="flex gap-4 items-start">
      {/* Left: Controls */}
      <BetControls
        onPlay={handlePlay}
        isPlaying={isPlaying}
        lastResult={lastResult}
        rows={rows}
        risk={risk}
        onRowsChange={setRows}
        onRiskChange={setRisk}
      />

      {/* Center: Board */}
      <div className="flex-1 flex flex-col items-center">
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

      {/* Right: Live Feed */}
      <LiveFeed />

      {/* Win/Loss popup — shown only after ball animation completes */}
      <WinDisplay result={showResult} onClose={() => setShowResult(null)} />
    </div>
  );
}
