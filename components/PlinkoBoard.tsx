"use client";

import { useEffect, useRef } from "react";
import { MULTIPLIERS, getBucketColor, formatMultiplier } from "@/constants/multipliers";

interface PlinkoBoardProps {
  rows: 8 | 12 | 16;
  risk: 0 | 1 | 2;
  activeBucket: number | null;
  isPlaying: boolean;
  onAnimationComplete?: () => void;
}

const PEG_RADIUS = 4;
const BALL_RADIUS = 7;

export function PlinkoBoard({ rows, risk, activeBucket, isPlaying, onAnimationComplete }: PlinkoBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  // Keep a stable ref so the animation closure always calls the latest callback
  const onCompleteRef = useRef(onAnimationComplete);
  onCompleteRef.current = onAnimationComplete;

  const W = 560;
  const H = 480;
  const paddingX = 40;
  const paddingTop = 30;
  const paddingBottom = 60;
  const gameH = H - paddingTop - paddingBottom;

  function getPegPos(row: number, col: number) {
    const rowY = paddingTop + (gameH / rows) * row;
    const spacing = (W - paddingX * 2) / rows;
    const startX = W / 2 - (spacing * row) / 2;
    return { x: startX + col * spacing, y: rowY };
  }

  function getBucketX(bucket: number) {
    const spacing = (W - paddingX * 2) / rows;
    return paddingX + bucket * spacing;
  }

  const buckets = MULTIPLIERS[rows][risk];

  function drawBoard(
    ctx: CanvasRenderingContext2D,
    ballX?: number,
    ballY?: number,
    highlightBucket?: number
  ) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0a1520";
    ctx.fillRect(0, 0, W, H);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col <= row; col++) {
        const { x, y } = getPegPos(row, col);
        ctx.beginPath();
        ctx.arc(x, y, PEG_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "#2a4060";
        ctx.fill();
        ctx.strokeStyle = "#4a6080";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    const bucketW = (W - paddingX * 2) / rows;
    const bucketY = H - paddingBottom;

    buckets.forEach((mult, i) => {
      const bx = getBucketX(i);
      const color = getBucketColor(mult);
      const isActive = highlightBucket === i;

      ctx.fillStyle = isActive ? color : color + "33";
      ctx.fillRect(bx - bucketW / 2 + 2, bucketY, bucketW - 4, paddingBottom - 8);

      ctx.strokeStyle = isActive ? color : color + "66";
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.strokeRect(bx - bucketW / 2 + 2, bucketY, bucketW - 4, paddingBottom - 8);

      ctx.fillStyle = isActive ? "#ffffff" : color + "cc";
      ctx.font = `bold ${mult >= 10000 ? 7 : 9}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(formatMultiplier(mult), bx, bucketY + (paddingBottom - 8) / 2 + 4);
    });

    if (ballX !== undefined && ballY !== undefined) {
      ctx.beginPath();
      ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(ballX - 2, ballY - 2, 1, ballX, ballY, BALL_RADIUS);
      gradient.addColorStop(0, "#ff6b6b");
      gradient.addColorStop(1, "#cc0000");
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = "#ff9999";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Animation effect — NOT gated on isPlaying.
  // usePlinko sets isPlaying=false inside `finally` before returning, so by the
  // time setActiveBucket(result.bucket) fires in page.tsx, isPlaying is already
  // false. Gating on isPlaying caused the animation to never run.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    cancelAnimationFrame(animRef.current);

    if (activeBucket === null) {
      if (isPlaying) {
        drawBoard(ctx, W / 2, paddingTop - 20, undefined);
      } else {
        drawBoard(ctx, undefined, undefined, undefined);
      }
      return;
    }

    // Randomly shuffle right/left moves so the path looks natural
    const path = [
      ...Array(activeBucket).fill(1),
      ...Array(rows - activeBucket).fill(0),
    ];
    for (let i = path.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [path[i], path[j]] = [path[j], path[i]];
    }

    let row = 0;
    let col = 0;
    let startX = W / 2;
    let startY = paddingTop - 30;
    let frame = 0;
    const framesPerRow = 12;

    const animate = () => {
      if (row >= rows) {
        // Ball has landed — draw final state then notify parent
        drawBoard(ctx, getBucketX(activeBucket), H - paddingBottom - BALL_RADIUS, activeBucket);
        onCompleteRef.current?.();
        return;
      }

      const { x: targetX, y: targetY } = getPegPos(row, col);
      const progress = (frame % framesPerRow) / framesPerRow;
      const bx = startX + (targetX - startX) * progress;
      const by = startY + (targetY - startY) * progress;

      drawBoard(ctx, bx, by, undefined);

      frame++;
      if (frame % framesPerRow === 0) {
        startX = targetX;
        startY = targetY;
        col = col + path[row];
        row++;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBucket, isPlaying, rows, risk]);

  // Redraw static board when rows/risk change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawBoard(ctx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, risk]);

  return (
    <div className="flex-1 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl border border-[#1e2d3d] max-w-full h-auto"
      />
    </div>
  );
}
