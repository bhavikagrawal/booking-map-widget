
"use client";

import React, { useRef, useEffect, useState } from 'react';
import type { Stall } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, RefreshCcw, Expand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StallModal } from './stall-modal';

const PIN_SIZE = 32;

interface FloorPlanCanvasProps {
  floorPlanUrl: string;
  stalls: Stall[];
  mode: 'organizer' | 'visitor';
  onStallSelect?: (stall: Stall) => void;
  onPinDrop?: (stall: Omit<Stall, 'id' | 'number' | 'name' | 'category' | 'segment'>) => void;
  selectedStallId?: string | null;
  className?: string;
  isStallModalOpen?: boolean;
  setIsStallModalOpen?: (isOpen: boolean) => void;
  currentStall?: Partial<Stall> | null;
  onSaveStall?: (stall: Stall) => void;
  onDeleteStall?: (stallId: string) => void;
}

export default function FloorPlanCanvas({
  floorPlanUrl,
  stalls,
  mode,
  onStallSelect,
  onPinDrop,
  selectedStallId,
  className,
  isStallModalOpen,
  setIsStallModalOpen,
  currentStall,
  onSaveStall,
  onDeleteStall,
}: FloorPlanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const container = containerRef.current;
    if (container) {
      if (isFullscreen) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      } else {
        canvas.width = container.clientWidth;
        canvas.height = imageRef.current ? 
          (container.clientWidth / imageRef.current.width) * imageRef.current.height : 
          container.clientHeight;
      }
    }
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    
    if (imageRef.current && imageRef.current.complete) {
      ctx.drawImage(imageRef.current, 0, 0, imageRef.current.width, imageRef.current.height);
    } else {
      ctx.fillStyle = '#f0f0f0';
      const width = imageRef.current?.width || canvas.width;
      const height = imageRef.current?.height || canvas.height;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#a0a0a0';
      ctx.font = '16px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = floorPlanUrl ? "Loading Floor Plan..." : "No Floor Plan Available";
      ctx.fillText(text, width / 2, height / 2);
    }
  
    stalls.forEach(stall => {
      const isSelected = stall.id === selectedStallId;
      const x = (stall.x / 100) * (imageRef.current?.width || canvas.width);
      const y = (stall.y / 100) * (imageRef.current?.height || canvas.height);
      
      const pinSize = PIN_SIZE / transform.scale;
      const pinColor = isSelected ? 'hsl(var(--primary))' : 'hsl(220 13% 69%)';
      const textColor = 'white';
  
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x, y - pinSize * 0.7, x - pinSize * 0.5, y - pinSize, x - pinSize * 0.5, y - pinSize);
      ctx.arc(x, y - pinSize, pinSize * 0.5, Math.PI, 0);
      ctx.bezierCurveTo(x + pinSize * 0.5, y - pinSize, x, y - pinSize * 0.7, x, y);
      ctx.closePath();
      
      ctx.fillStyle = pinColor;
      if (isSelected && mode === 'visitor') {
          ctx.shadowColor = 'hsl(var(--primary))';
          ctx.shadowBlur = 20;
      }
      ctx.fill();
      ctx.shadowColor = 'transparent';
  
      if (mode === 'organizer') {
        ctx.fillStyle = textColor;
        ctx.font = `bold ${pinSize * 0.4}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stall.number || '?', x, y - pinSize * 0.9);
      } else {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x, y - pinSize, pinSize * 0.25, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  
    ctx.restore();
  };
  
  const resetTransform = (fitToContainer: boolean = true) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
  
    const canvasWidth = isFullscreen ? window.innerWidth : container.clientWidth;
    const canvasHeight = isFullscreen ? window.innerHeight : container.clientHeight;
    
    if (imageRef.current) {
      const { width: imgWidth, height: imgHeight } = imageRef.current;
      
      const containerAspectRatio = canvasWidth / canvasHeight;
      const imageAspectRatio = imgWidth / imgHeight;

      let scale;
      if (fitToContainer) {
          if (imageAspectRatio > containerAspectRatio) {
              scale = canvasWidth / imgWidth;
          } else {
              scale = canvasHeight / imgHeight;
          }
      } else {
          scale = canvasWidth / imgWidth;
      }
      
      const x = (canvasWidth - imgWidth * scale) / 2;
      const y = (canvasHeight - imgHeight * scale) / 2;
      setTransform({ scale, x, y });
    } else {
      setTransform({ scale: 1, x: 0, y: 0 });
    }
  }

  useEffect(() => {
    const loadImage = () => {
      if (!floorPlanUrl) {
        imageRef.current = null;
        resetTransform();
        return;
      }
      
      const img = new Image();
      imageRef.current = img;
      img.crossOrigin = "anonymous";
      img.src = floorPlanUrl;
      img.onload = () => resetTransform(isFullscreen);
      img.onerror = () => {
        imageRef.current = null;
        draw();
      }
    }
    loadImage();
  }, [floorPlanUrl, isFullscreen]);

  useEffect(() => {
    draw();
  }, [stalls, selectedStallId, mode, transform, isFullscreen]);
  
  useEffect(() => {
    const handleResize = () => resetTransform(isFullscreen);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);

  const getTransformedMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
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
    const hitBoxScale = 1.5;

    for (const stall of [...stalls].reverse()) {
      const stallX = (stall.x / 100) * imageWidth;
      const stallY = (stall.y / 100) * imageHeight;
      
      const pinTop = stallY - (PIN_SIZE / transform.scale) * hitBoxScale;
      const pinBottom = stallY;
      const pinLeft = stallX - (PIN_SIZE/2 / transform.scale) * hitBoxScale;
      const pinRight = stallX + (PIN_SIZE/2 / transform.scale) * hitBoxScale;

      if (pos.x >= pinLeft && pos.x <= pinRight && pos.y >= pinTop && pos.y <= pinBottom) {
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scaleFactor = 1.2;
    const newScale = direction === 'in' ? transform.scale * scaleFactor : transform.scale / scaleFactor;
    const clampedScale = Math.max(0.1, Math.min(newScale, 10));

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const newX = centerX - (centerX - transform.x) * (clampedScale / transform.scale);
    const newY = centerY - (centerY - transform.y) * (clampedScale / transform.scale);
    
    setTransform({ scale: clampedScale, x: newX, y: newY });
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
  
  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
    setTimeout(() => resetTransform(!!document.fullscreenElement), 0);
  }

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);


  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  }

  return (
    <div 
        ref={containerRef} 
        className={cn("relative w-full bg-muted/50 rounded-lg border overflow-hidden flex justify-center items-center", className, {
            "fixed inset-0 z-[100]": isFullscreen,
        })}
    >
       <canvas
        ref={canvasRef}
        className={cn(mode === 'organizer' ? 'cursor-crosshair' : 'cursor-pointer', isPanning ? 'cursor-grabbing' : '', "max-w-full")}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
      />
      <div className="absolute top-2 right-2 flex flex-col gap-2">
        <Button size="icon" variant="outline" className="bg-background/80" onClick={() => handleZoom('in')}><ZoomIn /></Button>
        <Button size="icon" variant="outline" className="bg-background/80" onClick={() => handleZoom('out')}><ZoomOut /></Button>
        <Button size="icon" variant="outline" className="bg-background/80" onClick={() => resetTransform(isFullscreen)}><RefreshCcw /></Button>
        <Button size="icon" variant="outline" className="bg-background/80" onClick={handleFullscreen}><Expand /></Button>
      </div>
      
      {mode === 'organizer' && currentStall && setIsStallModalOpen && onSaveStall && onDeleteStall && (
        <StallModal
          isOpen={!!isStallModalOpen}
          setIsOpen={setIsStallModalOpen}
          stall={currentStall}
          onSave={onSaveStall}
          onDelete={onDeleteStall}
          allStalls={stalls}
          portalContainer={containerRef.current}
        />
      )}
    </div>
  );
}
