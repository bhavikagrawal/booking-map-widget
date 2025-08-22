"use client";

import React, { useRef, useEffect, useState } from 'react';
import type { Stall } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

const PIN_SIZE = 32; // Size of the pin icon
const PIN_HITBOX_SIZE = 40; // Clickable area for the pin

interface FloorPlanCanvasProps {
  floorPlanUrl: string;
  stalls: Stall[];
  mode: 'organizer' | 'visitor';
  onStallSelect?: (stall: Stall) => void;
  onPinDrop?: (stall: Omit<Stall, 'id' | 'number' | 'name' | 'category' | 'segment'>) => void;
  selectedStallId?: string | null;
  className?: string;
}

export default function FloorPlanCanvas({
  floorPlanUrl,
  stalls,
  mode,
  onStallSelect,
  onPinDrop,
  selectedStallId,
  className
}: FloorPlanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const stallImageRefs = useRef<{[key: string]: HTMLImageElement}>({});

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Background
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

    // Draw Stalls
    stalls.forEach(stall => {
      const isSelected = stall.id === selectedStallId;
      const x = (stall.x / 100) * canvas.width;
      const y = (stall.y / 100) * canvas.height;
      
      const stallImage = stall.id && stallImageRefs.current[stall.id];
      const pinColor = isSelected ? 'hsl(var(--primary))' : 'hsl(var(--destructive))';
      const textColor = isSelected ? 'white' : 'white';
      
      if (mode === 'visitor' && stall.image && stallImage && stallImage.complete && stallImage.naturalWidth > 0) {
        // Draw image as pin for visitor
        const aspectRatio = stallImage.naturalWidth / stallImage.naturalHeight;
        const pinWidth = PIN_SIZE * 1.5;
        const pinHeight = (pinWidth / aspectRatio);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y - pinHeight / 2, pinWidth / 2, 0, Math.PI * 2);
        ctx.closePath();
        
        if (isSelected) {
            ctx.shadowColor = 'hsl(var(--primary))';
            ctx.shadowBlur = 20;
        }

        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.clip();
        
        ctx.drawImage(stallImage, x - pinWidth/2, y - pinHeight, pinWidth, pinHeight);
        ctx.restore();

        if (isSelected) {
            ctx.strokeStyle = 'hsl(var(--primary))';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

      } else {
        // Draw Pin Icon
        ctx.fillStyle = pinColor;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(x, y - PIN_SIZE/2, x - PIN_SIZE/2, y - PIN_SIZE/2, x - PIN_SIZE/2, y - PIN_SIZE * 0.7);
        ctx.arc(x, y - PIN_SIZE * 0.7, PIN_SIZE/2, -Math.PI, 0);
        ctx.bezierCurveTo(x + PIN_SIZE/2, y - PIN_SIZE/2, x, y - PIN_SIZE/2, x, y);
        ctx.fill();
        ctx.closePath();
        
        // Draw stall number inside pin
        ctx.fillStyle = textColor;
        ctx.font = `bold ${PIN_SIZE * 0.4}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stall.number || '?', x, y - PIN_SIZE * 0.7);
      }
    });
  };
  
  const preloadStallImages = () => {
    stalls.forEach(stall => {
      if (stall.image && !stallImageRefs.current[stall.id]) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = stall.image;
        img.onload = () => draw();
        img.onerror = () => draw(); // Still draw if image fails
        stallImageRefs.current[stall.id] = img;
      }
    })
  };

  useEffect(() => {
    preloadStallImages();
  }, [stalls]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const setCanvasSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      const { width } = parent.getBoundingClientRect();
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
    
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setCanvasSize();
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
        setCanvasSize();
      };
      img.onerror = () => {
        imageRef.current = null;
        setCanvasSize();
      }
    } else {
      imageRef.current = null;
      setCanvasSize();
    }

    return () => resizeObserver.disconnect();
  }, [floorPlanUrl]);

  useEffect(() => {
    draw();
  }, [stalls, selectedStallId, mode]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const canvas = canvasRef.current!;

    // Check if a stall was clicked
    let clickedStall: Stall | null = null;
    // Iterate in reverse to select top-most stall
    for (const stall of [...stalls].reverse()) {
      const stallX = (stall.x / 100) * canvas.width;
      const stallY = (stall.y / 100) * canvas.height;
      const dist = Math.sqrt(Math.pow(pos.x - stallX, 2) + Math.pow(pos.y - (stallY - PIN_SIZE/2), 2));
      
      if (dist < PIN_HITBOX_SIZE / 2) {
          clickedStall = stall;
          break;
      }
    }

    if (clickedStall) {
      onStallSelect?.(clickedStall);
    } else if (mode === 'organizer') {
      // If no stall clicked in organizer mode, it's a new pin drop
      onPinDrop?.({
        x: (pos.x / canvas.width) * 100,
        y: (pos.y / canvas.height) * 100,
      });
    }
  };

  return (
    <div className={cn("relative w-full h-full bg-muted/50 rounded-lg overflow-hidden border", className)}>
       <canvas
        ref={canvasRef}
        className={cn("w-full h-auto", mode === 'organizer' ? 'cursor-crosshair' : 'cursor-pointer')}
        onClick={handleClick}
      />
    </div>
  );
}
