"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { formatMultiplier } from "@/constants/multipliers";
import { GameResult } from "@/hooks/usePlinko";

interface WinDisplayProps {
  result: GameResult | null;
  onClose: () => void;
}

export function WinDisplay({ result, onClose }: WinDisplayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (result) {
      setVisible(true);

      // Fire confetti for big wins (≥ 10x — multiplier is stored as x100, so 1000 = 10x)
      if (result.multiplier >= 100) {
        confetti({
          particleCount: 180,
          spread: 90,
          origin: { y: 0.5 },
          colors: ["#836EF9", "#a78bfa", "#ffd700", "#ffffff", "#34d399"],
        });
        // Second burst slightly delayed for extra effect
        setTimeout(() => {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { x: 0.2, y: 0.6 },
            colors: ["#836EF9", "#ffd700"],
          });
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { x: 0.8, y: 0.6 },
            colors: ["#a78bfa", "#ffffff"],
          });
        }, 200);
      }

      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [result, onClose]);

  if (!result) return null;

  const won = result.payout > result.bet;
  const profit = won ? result.payout - result.bet : result.bet - result.payout;
  const profitEth = (Number(profit) / 1e18).toFixed(4);
  const multiplierStr = formatMultiplier(result.multiplier);
  const isBigWin = result.multiplier >= 1000;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`px-10 py-6 rounded-2xl text-center shadow-2xl border-2 backdrop-blur-sm transition-transform duration-300 ${
          visible ? "scale-100" : "scale-90"
        } ${
          won
            ? isBigWin
              ? "bg-[#1a0a40]/90 border-[#836EF9] shadow-[#836EF9]/40"
              : "bg-green-900/80 border-green-400 shadow-green-500/30"
            : "bg-red-900/80 border-red-400 shadow-red-500/30"
        }`}
      >
        {isBigWin && (
          <div className="text-xs font-bold tracking-widest text-[#836EF9] mb-1 uppercase">
            Big Win!
          </div>
        )}
        <div
          className={`font-black mb-1 ${
            isBigWin ? "text-6xl text-[#a78bfa]" : "text-5xl"
          } ${won ? (isBigWin ? "" : "text-green-400") : "text-red-400"}`}
        >
          {multiplierStr}
        </div>
        <div
          className={`text-xl font-bold ${
            won ? (isBigWin ? "text-[#c4b5fd]" : "text-green-300") : "text-red-300"
          }`}
        >
          {won ? `+${profitEth} MON` : `-${profitEth} MON`}
        </div>
        <div className="text-sm text-gray-400 mt-1">
          {won ? (isBigWin ? "Incredible!" : "You Win!") : "Try Again!"}
        </div>
      </div>
    </div>
  );
}
