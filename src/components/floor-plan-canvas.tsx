"use client";

import React, { useRef, useEffect, useState } from 'react';
import type { Stall } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, Redo, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PIN_SIZE = 32;
const PIN_HITBOX_SIZE = 40;

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
  const stallImageRefs = useRef<{ [key: string]: HTMLImageElement }>({});
  
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    
    // Draw Background
    if (imageRef.current && imageRef.current.complete) {
      ctx.drawImage(imageRef.current, 0, 0, imageRef.current.width, imageRef.current.height);
    } else {
      ctx.fillStyle = '#f0f0f0';
      const width = canvas.width / transform.scale;
      const height = canvas.height / transform.scale;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#a0a0a0';
      ctx.font = '16px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = floorPlanUrl ? "Loading Floor Plan..." : "No Floor Plan Available";
      ctx.fillText(text, width / 2, height / 2);
    }

    // Draw Stalls
    stalls.forEach(stall => {
      const isSelected = stall.id === selectedStallId;
      const x = (stall.x / 100) * (imageRef.current?.width || canvas.width);
      const y = (stall.y / 100) * (imageRef.current?.height || canvas.height);
      
      const stallImage = stall.id && stallImageRefs.current[stall.id];
      
      if (mode === 'visitor' && stall.image && stallImage && stallImage.complete && stallImage.naturalWidth > 0) {
        // Visitor view: Draw image as pin
        const visitorPinSize = PIN_SIZE * 2.5;
        const aspectRatio = stallImage.naturalWidth / stallImage.naturalHeight;
        const pinWidth = visitorPinSize;
        const pinHeight = pinWidth / aspectRatio;
        
        ctx.save();
        ctx.beginPath();
        const circleCenterY = y - pinHeight / 2;
        ctx.arc(x, circleCenterY, pinWidth / 2, 0, Math.PI * 2);
        ctx.closePath();
        
        if (isSelected) {
            ctx.shadowColor = 'hsl(var(--primary))';
            ctx.shadowBlur = 40 / transform.scale;
        }

        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.clip();
        
        ctx.drawImage(stallImage, x - pinWidth/2, y - pinHeight, pinWidth, pinHeight);
        ctx.restore();

        if (isSelected) {
            ctx.beginPath();
            ctx.arc(x, y - pinHeight / 2, pinWidth / 2, 0, Math.PI * 2);
            ctx.strokeStyle = 'hsl(var(--primary))';
            ctx.lineWidth = 6 / transform.scale;
            ctx.stroke();
            ctx.closePath();
        }

      } else {
        // Organizer view or fallback: Draw Pin Icon
        const pinColor = isSelected ? 'hsl(var(--primary))' : 'hsl(220 13% 69%)'; // Grey for unselected
        const textColor = 'white';
        
        const scaledPinSize = PIN_SIZE / transform.scale;
        const path = new Path2D(`M ${x} ${y} C ${x} ${y - scaledPinSize/2}, ${x - scaledPinSize/2} ${y - scaledPinSize/2}, ${x - scaledPinSize/2} ${y - scaledPinSize * 0.7} A ${scaledPinSize/2} ${scaledPinSize/2} 0 1 1 ${x + scaledPinSize/2} ${y - scaledPinSize * 0.7} C ${x + scaledPinSize/2} ${y - scaledPinSize/2}, ${x} ${y - scaledPinSize/2}, ${x} ${y}`);
        ctx.fillStyle = pinColor;
        ctx.fill(path);
        
        ctx.fillStyle = textColor;
        ctx.font = `bold ${scaledPinSize * 0.4}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stall.number || '?', x, y - scaledPinSize * 0.7);
      }
    });

    ctx.restore();
  };

  const resetTransform = (canvas: HTMLCanvasElement) => {
    if (!imageRef.current) {
        setTransform({ scale: 1, x: 0, y: 0 });
        return;
    }
    const { width: imgWidth, height: imgHeight } = imageRef.current;
    const { width: canvasWidth, height: canvasHeight } = canvas;
    const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
    const x = (canvasWidth - imgWidth * scale) / 2;
    const y = (canvasHeight - imgHeight * scale) / 2;
    setTransform({ scale, x, y });
  }
  
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

    const setInitialCanvasSize = () => {
        const parent = canvas.parentElement;
        if (!parent) return;
        const { width } = parent.getBoundingClientRect();
        canvas.width = width;
        canvas.height = width * (9/16); // default aspect ratio
        if (floorPlanUrl && !imageRef.current) {
          const img = new Image();
          imageRef.current = img;
          img.crossOrigin = "anonymous";
          img.src = floorPlanUrl;
          img.onload = () => {
            canvas.width = parent.getBoundingClientRect().width;
            canvas.height = (canvas.width / img.naturalWidth) * img.naturalHeight;
            resetTransform(canvas);
          };
        } else {
            resetTransform(canvas);
        }
    }

    setInitialCanvasSize();
    
    const resizeObserver = new ResizeObserver(() => {
        const parent = canvas.parentElement;
        if (!parent) return;
        canvas.width = parent.getBoundingClientRect().width;
        canvas.height = (canvas.width / (imageRef.current?.naturalWidth || 16)) * (imageRef.current?.naturalHeight || 9);
        resetTransform(canvas);
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    
    return () => resizeObserver.disconnect();
  }, [floorPlanUrl]);

  useEffect(() => {
    draw();
  }, [stalls, selectedStallId, mode, transform]);

  const getTransformedMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left - transform.x) / transform.scale;
    const y = (e.clientY - rect.top - transform.y) / transform.scale;
    return { x, y };
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getTransformedMousePos(e);
    const canvas = canvasRef.current!;
    const imageWidth = imageRef.current?.width || canvas.width;
    const imageHeight = imageRef.current?.height || canvas.height;

    let clickedStall: Stall | null = null;
    const scaledHitbox = PIN_HITBOX_SIZE / transform.scale;

    for (const stall of [...stalls].reverse()) {
      const stallX = (stall.x / 100) * imageWidth;
      const stallY = (stall.y / 100) * imageHeight;
      const scaledPinSize = PIN_SIZE / transform.scale;

      const dist = Math.sqrt(Math.pow(pos.x - stallX, 2) + Math.pow(pos.y - (stallY - scaledPinSize/2), 2));
      
      if (dist < scaledHitbox / 2) {
          clickedStall = stall;
          break;
      }
    }

    if (clickedStall) {
      onStallSelect?.(clickedStall);
    } else if (mode === 'organizer') {
      onPinDrop?.({
        x: (pos.x / imageWidth) * 100,
        y: (pos.y / imageHeight) * 100,
      });
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const scaleFactor = 1.2;
    const newScale = direction === 'in' ? transform.scale * scaleFactor : transform.scale / scaleFactor;
    setTransform(prev => ({ ...prev, scale: Math.max(0.1, Math.min(newScale, 10))}));
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPanning(true);
    setLastPanPosition({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseUp = () => {
    setIsPanning(false);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPanning) return;
    const dx = e.clientX - lastPanPosition.x;
    const dy = e.clientY - lastPanPosition.y;
    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    setLastPanPosition({ x: e.clientX, y: e.clientY });
  };


  return (
    <div className={cn("relative w-full h-full bg-muted/50 rounded-lg overflow-hidden border", className)}>
       <canvas
        ref={canvasRef}
        className={cn("w-full h-full", mode === 'organizer' ? 'cursor-crosshair' : 'cursor-pointer', isPanning ? 'cursor-grabbing' : '')}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
      />
      <div className="absolute top-2 right-2 flex flex-col gap-2">
        <Button size="icon" variant="outline" className="bg-background/80" onClick={() => handleZoom('in')}><ZoomIn /></Button>
        <Button size="icon" variant="outline" className="bg-background/80" onClick={() => handleZoom('out')}><ZoomOut /></Button>
        <Button size="icon" variant="outline" className="bg-background/80" onClick={() => canvasRef.current && resetTransform(canvasRef.current)}><Redo /></Button>
      </div>
    </div>
  );
}
