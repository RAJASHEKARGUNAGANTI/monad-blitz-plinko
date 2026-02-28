"use client";

import { useEffect, useRef, useState } from "react";
import { MULTIPLIERS, getBucketColor, formatMultiplier } from "@/constants/multipliers";

interface PlinkoBoardProps {
  rows: 8 | 12 | 16;
  risk: 0 | 1 | 2;
  activeBucket: number | null;  // which bucket the ball landed in (null = no result yet)
  isPlaying: boolean;
}

const PEG_RADIUS = 4;
const BALL_RADIUS = 7;

export function PlinkoBoard({ rows, risk, activeBucket, isPlaying }: PlinkoBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [ballPos, setBallPos] = useState<{ x: number; y: number } | null>(null);

  // Board dimensions
  const W = 560;
  const H = 480;
  const paddingX = 40;
  const paddingTop = 30;
  const paddingBottom = 60;
  const gameH = H - paddingTop - paddingBottom;

  function getPegPos(row: number, col: number) {
    const numPegs = row + 1;
    const rowY = paddingTop + (gameH / rows) * row;
    const totalWidth = W - paddingX * 2;
    const spacing = totalWidth / (rows); // consistent peg spacing
    const startX = W / 2 - (spacing * row) / 2;
    return { x: startX + col * spacing, y: rowY };
  }

  function getBucketX(bucket: number) {
    const numBuckets = rows + 1;
    const totalWidth = W - paddingX * 2;
    const spacing = totalWidth / rows;
    return paddingX + bucket * spacing;
  }

  const buckets = MULTIPLIERS[rows][risk];

  // Draw static board
  function drawBoard(ctx: CanvasRenderingContext2D, ballX?: number, ballY?: number, highlightBucket?: number) {
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#0a1520";
    ctx.fillRect(0, 0, W, H);

    // Draw pegs
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

    // Draw buckets
    const bucketW = (W - paddingX * 2) / rows;
    const bucketY = H - paddingBottom;

    buckets.forEach((mult, i) => {
      const bx = getBucketX(i);
      const color = getBucketColor(mult);
      const isActive = highlightBucket === i;

      // Bucket background
      ctx.fillStyle = isActive ? color : color + "33";
      ctx.fillRect(bx - bucketW / 2 + 2, bucketY, bucketW - 4, paddingBottom - 8);

      // Border
      ctx.strokeStyle = isActive ? color : color + "66";
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.strokeRect(bx - bucketW / 2 + 2, bucketY, bucketW - 4, paddingBottom - 8);

      // Label
      ctx.fillStyle = isActive ? "#ffffff" : color + "cc";
      ctx.font = `bold ${mult >= 10000 ? 7 : 9}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(formatMultiplier(mult), bx, bucketY + (paddingBottom - 8) / 2 + 4);
    });

    // Draw ball
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

  // Animate ball drop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (activeBucket === null || !isPlaying) {
      drawBoard(ctx, undefined, undefined, activeBucket ?? undefined);
      return;
    }

    // Build a ball path that ends at activeBucket
    // Fill right-moves from the bottom up to ensure correct bucket landing
    const actualPath = new Array(rows).fill(0);
    let leftOver = activeBucket;
    for (let i = rows - 1; i >= 0; i--) {
      if (leftOver > 0) { actualPath[i] = 1; leftOver--; }
    }

    // Animate along path
    let row = 0;
    let col = 0;
    let startY = paddingTop - 30;
    let startX = W / 2;
    let frame = 0;
    const framesPerRow = 12;

    const animate = () => {
      if (row >= rows) {
        // Ball reached bucket
        const finalX = getBucketX(activeBucket);
        const finalY = H - paddingBottom - BALL_RADIUS;
        drawBoard(ctx, finalX, finalY, activeBucket);
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
        const goRight = actualPath[row];
        col = col + goRight;
        row++;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBucket, isPlaying, rows, risk]);

  // Initial draw
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
