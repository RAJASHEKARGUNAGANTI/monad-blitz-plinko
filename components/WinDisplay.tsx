"use client";

import { useEffect, useState } from "react";
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
      const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, 3000);
      return () => clearTimeout(t);
    }
  }, [result, onClose]);

  if (!result) return null;

  const won = result.payout > result.bet;
  const profit = won ? result.payout - result.bet : result.bet - result.payout;
  const profitEth = (Number(profit) / 1e18).toFixed(4);
  const multiplierStr = formatMultiplier(result.multiplier);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div
        className={`px-10 py-6 rounded-2xl text-center shadow-2xl border-2 backdrop-blur-sm ${
          won
            ? "bg-green-900/80 border-green-400 shadow-green-500/30"
            : "bg-red-900/80 border-red-400 shadow-red-500/30"
        }`}
      >
        <div className={`text-5xl font-black mb-1 ${won ? "text-green-400" : "text-red-400"}`}>
          {multiplierStr}
        </div>
        <div className={`text-xl font-bold ${won ? "text-green-300" : "text-red-300"}`}>
          {won ? `+${profitEth} MON` : `-${profitEth} MON`}
        </div>
        <div className="text-sm text-gray-400 mt-1">
          {won ? "You Win!" : "Try Again!"}
        </div>
      </div>
    </div>
  );
}
