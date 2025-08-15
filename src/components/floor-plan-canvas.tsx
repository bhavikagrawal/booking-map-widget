"use client";

import React, { useRef, useEffect, useState } from 'react';
import type { Stall } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FloorPlanCanvasProps {
  floorPlanUrl: string;
  stalls: Stall[];
  mode: 'organizer' | 'visitor';
  onStallSelect?: (stall: Stall) => void;
  onStallDraw?: (stall: Omit<Stall, 'id' | 'number' | 'name' | 'category' | 'segment'>) => void;
  selectedStallId?: string | null;
  className?: string;
}

export default function FloorPlanCanvas({
  floorPlanUrl,
  stalls,
  mode,
  onStallSelect,
  onStallDraw,
  selectedStallId,
  className
}: FloorPlanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [drawingRect, setDrawingRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (imageRef.current && imageRef.current.complete) {
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#a0a0a0';
      ctx.font = '16px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = floorPlanUrl ? "Loading Floor Plan..." : "No Floor Plan Available";
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    }

    stalls.forEach(stall => {
      const isSelected = stall.id === selectedStallId;
      const x = (stall.x / 100) * canvas.width;
      const y = (stall.y / 100) * canvas.height;
      const w = (stall.width / 100) * canvas.width;
      const h = (stall.height / 100) * canvas.height;

      ctx.fillStyle = isSelected ? 'hsla(var(--primary), 0.7)' : 'hsla(var(--secondary-foreground), 0.5)';
      ctx.strokeStyle = isSelected ? 'hsl(var(--primary))' : 'hsl(var(--secondary-foreground))';
      ctx.lineWidth = isSelected ? 3 : 1.5;

      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))';
      ctx.font = `bold ${Math.min(16, w/3, h/3)}px Inter`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stall.number || '?', x + w / 2, y + h / 2);
    });

    if (drawingRect) {
      ctx.fillStyle = 'hsla(var(--accent), 0.4)';
      ctx.strokeStyle = 'hsl(var(--accent))';
      ctx.lineWidth = 2;
      ctx.strokeRect(drawingRect.x, drawingRect.y, drawingRect.width, drawingRect.height);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        const img = imageRef.current;
        if(img && img.naturalWidth > 0) {
            canvas.width = width;
            canvas.height = (width / img.naturalWidth) * img.naturalHeight;
        } else {
            canvas.width = width;
            canvas.height = width * (9/16);
        }
        draw();
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    
    if (floorPlanUrl) {
      const img = new Image();
      imageRef.current = img;
      img.crossOrigin = "anonymous";
      img.src = floorPlanUrl;
      img.onload = () => {
         if (canvas.parentElement) {
            const { width } = canvas.parentElement.getBoundingClientRect();
            canvas.width = width;
            canvas.height = (width / img.naturalWidth) * img.naturalHeight;
         }
        draw();
      };
      img.onerror = () => {
        imageRef.current = null;
        draw();
      }
    } else {
      imageRef.current = null;
      draw();
    }

    return () => resizeObserver.disconnect();
  }, [floorPlanUrl]);

  useEffect(() => {
    draw();
  }, [stalls, selectedStallId, drawingRect]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const canvas = canvasRef.current!;
    let clickedOnStall = false;

    for (const stall of stalls) {
      const stallX = (stall.x / 100) * canvas.width;
      const stallY = (stall.y / 100) * canvas.height;
      const stallW = (stall.width / 100) * canvas.width;
      const stallH = (stall.height / 100) * canvas.height;
      if (pos.x >= stallX && pos.x <= stallX + stallW && pos.y >= stallY && pos.y <= stallY + stallH) {
        onStallSelect?.(stall);
        clickedOnStall = true;
        break;
      }
    }

    if (mode === 'organizer' && !clickedOnStall) {
      setIsDrawing(true);
      setStartPos(pos);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== 'organizer') return;
    const pos = getMousePos(e);
    const newRect = {
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      width: Math.abs(pos.x - startPos.x),
      height: Math.abs(pos.y - startPos.y),
    };
    setDrawingRect(newRect);
  };

  const handleMouseUp = () => {
    if (!isDrawing || mode !== 'organizer') return;
    setIsDrawing(false);
    if (drawingRect && drawingRect.width > 5 && drawingRect.height > 5) {
      const canvas = canvasRef.current!;
      onStallDraw?.({
        x: (drawingRect.x / canvas.width) * 100,
        y: (drawingRect.y / canvas.height) * 100,
        width: (drawingRect.width / canvas.width) * 100,
        height: (drawingRect.height / canvas.height) * 100,
      });
    }
    setDrawingRect(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'visitor') return;
    const pos = getMousePos(e);
    const canvas = canvasRef.current!;
    
    for (const stall of stalls) {
      const stallX = (stall.x / 100) * canvas.width;
      const stallY = (stall.y / 100) * canvas.height;
      const stallW = (stall.width / 100) * canvas.width;
      const stallH = (stall.height / 100) * canvas.height;
      if (pos.x >= stallX && pos.x <= stallX + stallW && pos.y >= stallY && pos.y <= stallY + stallH) {
        onStallSelect?.(stall);
        break;
      }
    }
  }

  return (
    <div className={cn("relative w-full h-full bg-muted/50 rounded-lg overflow-hidden border", className)}>
       <canvas
        ref={canvasRef}
        className={cn("w-full h-auto", mode === 'organizer' ? 'cursor-crosshair' : 'cursor-pointer')}
        onMouseDown={mode === 'organizer' ? handleMouseDown : undefined}
        onMouseMove={mode === 'organizer' ? handleMouseMove : undefined}
        onMouseUp={mode === 'organizer' ? handleMouseUp : undefined}
        onClick={mode === 'visitor' ? handleClick : undefined}
      />
    </div>
  );
}
