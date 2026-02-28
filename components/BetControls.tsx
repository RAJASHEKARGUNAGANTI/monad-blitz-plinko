"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

interface BetControlsProps {
  onPlay: (bet: string, rows: 8 | 12 | 16, risk: 0 | 1 | 2) => void;
  isPlaying: boolean;
  lastResult: { multiplier: number; payout: bigint; bet: bigint } | null;
  rows: 8 | 12 | 16;
  risk: 0 | 1 | 2;
  onRowsChange: (r: 8 | 12 | 16) => void;
  onRiskChange: (r: 0 | 1 | 2) => void;
}

const ROWS_OPTIONS: (8 | 12 | 16)[] = [8, 12, 16];
const RISK_OPTIONS: { value: 0 | 1 | 2; label: string }[] = [
  { value: 0, label: "Low" },
  { value: 1, label: "Medium" },
  { value: 2, label: "High" },
];

export function BetControls({ onPlay, isPlaying, lastResult, rows, risk, onRowsChange, onRiskChange }: BetControlsProps) {
  const { authenticated, login } = usePrivy();
  const [bet, setBet] = useState("0.01");

  const handleHalf = () => {
    const v = parseFloat(bet);
    if (!isNaN(v)) setBet(Math.max(0.001, v / 2).toFixed(3));
  };
  const handleDouble = () => {
    const v = parseFloat(bet);
    if (!isNaN(v)) setBet(Math.min(1, v * 2).toFixed(3));
  };

  const handlePlay = () => {
    if (!authenticated) { login(); return; }
    const v = parseFloat(bet);
    if (isNaN(v) || v < 0.001 || v > 1) return;
    onPlay(bet, rows, risk);
  };

  const won = lastResult && lastResult.payout > lastResult.bet;
  const lastMultiplier = lastResult ? (lastResult.multiplier / 100).toFixed(2) : null;

  return (
    <div className="w-64 bg-[#0f1923] border border-[#1e2d3d] rounded-xl p-4 flex flex-col gap-4">
      {/* Last result badge */}
      {lastResult && (
        <div className={`text-center py-2 rounded-lg text-sm font-semibold ${won ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
          {won
            ? `+${(Number(lastResult.payout - lastResult.bet) / 1e18).toFixed(4)} MON · ${lastMultiplier}x`
            : `-${(Number(lastResult.bet - lastResult.payout) / 1e18).toFixed(4)} MON · ${lastMultiplier}x`}
        </div>
      )}

      {/* Bet amount */}
      <div>
        <label className="text-gray-400 text-xs mb-1 block">Bet Amount (MON)</label>
        <div className="flex gap-2">
          <input
          title="bet"
            type="number"
            value={bet}
            onChange={(e) => setBet(e.target.value)}
            min="0.001"
            max="1"
            step="0.001"
            className="flex-1 bg-[#1e2d3d] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#836EF9]"
          />
          <button onClick={handleHalf} className="px-2 py-2 bg-[#1e2d3d] text-gray-300 rounded-lg text-xs hover:bg-[#2a3d52] transition-colors">½</button>
          <button onClick={handleDouble} className="px-2 py-2 bg-[#1e2d3d] text-gray-300 rounded-lg text-xs hover:bg-[#2a3d52] transition-colors">2×</button>
        </div>
        <div className="text-xs text-gray-500 mt-1">Min: 0.001 · Max: 1.000</div>
      </div>

      {/* Risk */}
      <div>
        <label className="text-gray-400 text-xs mb-1 block">Risk</label>
        <div className="flex gap-2">
          {RISK_OPTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => onRiskChange(r.value)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                risk === r.value
                  ? "bg-[#836EF9] text-white"
                  : "bg-[#1e2d3d] text-gray-400 hover:bg-[#2a3d52]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div>
        <label className="text-gray-400 text-xs mb-1 block">Rows</label>
        <div className="flex gap-2">
          {ROWS_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => onRowsChange(r)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                rows === r
                  ? "bg-[#836EF9] text-white"
                  : "bg-[#1e2d3d] text-gray-400 hover:bg-[#2a3d52]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Play button */}
      <button
        onClick={handlePlay}
        disabled={isPlaying}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
          isPlaying
            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/20 active:scale-95"
        }`}
      >
        {isPlaying ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Dropping...
          </span>
        ) : authenticated ? (
          "Drop Ball"
        ) : (
          "Connect to Play"
        )}
      </button>
    </div>
  );
}
