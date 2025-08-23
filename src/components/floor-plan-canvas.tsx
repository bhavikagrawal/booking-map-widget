
"use client";

import React, { useRef, useEffect, useState } from 'react';
import type { Stall } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, RefreshCcw, Expand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StallModal } from './stall-modal';

const PIN_SIZE = 12;

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
  const [hoveredStall, setHoveredStall] = useState<Stall | null>(null);

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
      } else if (imageRef.current) {
        const containerWidth = container.clientWidth;
        canvas.width = containerWidth;
        canvas.height = (containerWidth / imageRef.current.naturalWidth) * imageRef.current.naturalHeight;
      } else {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    }
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    
    if (imageRef.current && imageRef.current.complete) {
      ctx.drawImage(imageRef.current, 0, 0, imageRef.current.naturalWidth, imageRef.current.naturalHeight);
    } else {
      ctx.fillStyle = '#f0f0f0';
      const width = imageRef.current?.naturalWidth || canvas.width;
      const height = imageRef.current?.naturalHeight || canvas.height;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#a0a0a0';
      ctx.font = '16px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = floorPlanUrl ? "Loading Floor Plan..." : "No Floor Plan Available";
      ctx.fillText(text, width / 2, height / 2);
    }
  
    const imageWidth = imageRef.current?.naturalWidth || canvas.width;
    const imageHeight = imageRef.current?.naturalHeight || canvas.height;

    stalls.forEach(stall => {
      const isSelected = stall.id === selectedStallId;
      const isHovered = stall.id === hoveredStall?.id;
      const x = (stall.x / 100) * imageWidth;
      const y = (stall.y / 100) * imageHeight;
      
      const dotRadius = PIN_SIZE / transform.scale;
      
      ctx.save();
      ctx.translate(x, y);

      // Draw outer ring for selected/hovered
      if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(0, 0, dotRadius + 4/transform.scale, 0, 2 * Math.PI);
          ctx.strokeStyle = isSelected ? 'hsl(var(--primary))' : 'hsl(0 84% 60%)';
          ctx.lineWidth = 3 / transform.scale;
          ctx.stroke();
      }
      
      // Draw dot
      ctx.beginPath();
      ctx.arc(0, 0, dotRadius, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? 'hsl(var(--primary))' : 'hsl(0 84% 60%)';
      ctx.fill();

      // Draw white inner dot
      ctx.beginPath();
      ctx.arc(0, 0, dotRadius * 0.4, 0, 2 * Math.PI);
      ctx.fillStyle = 'white';
      ctx.fill();

      ctx.restore();
    });

    if (hoveredStall) {
      const x = (hoveredStall.x / 100) * imageWidth;
      const y = (hoveredStall.y / 100) * imageHeight;
      const tooltipY = y - (PIN_SIZE / transform.scale) * 2.5;
      
      const lines = [
        `Stall: ${hoveredStall.number}`,
        `Name: ${hoveredStall.name}`,
        `Category: ${hoveredStall.category}`
      ];
      
      ctx.font = `500 ${14 / transform.scale}px Inter`;
      const textMetrics = lines.map(line => ctx.measureText(line));
      const tooltipWidth = Math.max(...textMetrics.map(m => m.width)) + 20 / transform.scale;
      const lineHeight = 18 / transform.scale;
      const tooltipHeight = (lines.length * lineHeight) + 10 / transform.scale;
      let tooltipX = x - tooltipWidth / 2;

      // prevent tooltip from going off-screen
      if(imageRef.current) {
        if(tooltipX < 0) tooltipX = 5 / transform.scale;
        if(tooltipX + tooltipWidth > imageRef.current.naturalWidth) tooltipX = imageRef.current.naturalWidth - tooltipWidth - 5 / transform.scale;
      }
      
      // Draw tooltip background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1 / transform.scale;
      ctx.beginPath();
      ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 5 / transform.scale);
      ctx.fill();
      ctx.stroke();

      // Draw tooltip text
      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      lines.forEach((line, index) => {
        ctx.fillText(line, tooltipX + 10 / transform.scale, tooltipY + (lineHeight * (index + 0.5)) + 5 / transform.scale);
      });
    }
  
    ctx.restore();
  };
  
  const resetTransform = (fitToContainer: boolean = true) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    if (imageRef.current) {
        let scale;
        const targetWidth = isFullscreen ? window.innerWidth : container.clientWidth;
        let targetHeight = container.clientHeight;
        
        if(isFullscreen) {
          targetHeight = window.innerHeight;
        } else if (imageRef.current && imageRef.current.naturalHeight > 0) {
            targetHeight = (targetWidth / imageRef.current.naturalWidth) * imageRef.current.naturalHeight;
        }


        if (fitToContainer && imageRef.current.naturalHeight > 0) {
            const scaleX = targetWidth / imageRef.current.naturalWidth;
            const scaleY = targetHeight / imageRef.current.naturalHeight;
            scale = Math.min(scaleX, scaleY);
        } else {
            scale = targetWidth / imageRef.current.naturalWidth;
        }

        const x = (targetWidth - imageRef.current.naturalWidth * scale) / 2;
        const y = (targetHeight - imageRef.current.naturalHeight * scale) / 2;
        setTransform({ scale, x: Math.max(0, x), y: Math.max(0, y) });
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
      img.onload = () => {
        const container = containerRef.current;
        if(container) {
            const containerWidth = container.clientWidth;
            const scale = containerWidth / img.naturalWidth;
            setTransform({ scale: scale, x: 0, y: 0 });
        } else {
            resetTransform(isFullscreen);
        }
      };
      img.onerror = () => {
        imageRef.current = null;
        draw();
      }
    }
    loadImage();
  }, [floorPlanUrl]);

  useEffect(() => {
    draw();
  }, [stalls, selectedStallId, mode, transform, isFullscreen, hoveredStall]);
  
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

  const getStallAtPos = (pos: {x: number, y: number}) => {
    if (!imageRef.current) return null;
    const imageWidth = imageRef.current.naturalWidth;
    const imageHeight = imageRef.current.naturalHeight;
    
    let foundStall: Stall | null = null;
    const hitBoxScale = 2.5;

    for (const stall of [...stalls].reverse()) {
      const stallX = (stall.x / 100) * imageWidth;
      const stallY = (stall.y / 100) * imageHeight;
      
      const dx = pos.x - stallX;
      const dy = pos.y - stallY;
      const radius = (PIN_SIZE / transform.scale) * hitBoxScale;

      if (dx * dx + dy * dy < radius * radius) {
        foundStall = stall;
        break;
      }
    }
    return foundStall;
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getTransformedMousePos(e);
    const clickedStall = getStallAtPos(pos);

    if (clickedStall) {
      onStallSelect?.(clickedStall);
    } else if (mode === 'organizer') {
      if (!imageRef.current) return;
      const imageWidth = imageRef.current.naturalWidth;
      const imageHeight = imageRef.current.naturalHeight;
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
    const pos = getTransformedMousePos(e);
    const stall = getStallAtPos(pos);
    setHoveredStall(stall);
    
    if (!isPanning) return;
    const dx = e.clientX - lastPanPosition.x;
    const dy = e.clientY - lastPanPosition.y;
    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    setLastPanPosition({ x: e.clientX, y: e.clientY });
  };
  
  const handleFullscreenChange = () => {
    const isCurrentlyFullscreen = !!document.fullscreenElement;
    setIsFullscreen(isCurrentlyFullscreen);
    resetTransform(isCurrentlyFullscreen);
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
        className={cn("relative w-full overflow-auto bg-muted/50 rounded-lg border", className, {
            "fixed inset-0 z-[100]": isFullscreen,
        })}
    >
       <canvas
        ref={canvasRef}
        className={cn(mode === 'organizer' ? 'cursor-crosshair' : 'cursor-pointer', isPanning ? 'cursor-grabbing' : '', hoveredStall ? 'cursor-pointer' : '')}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { handleMouseUp(); setHoveredStall(null); }}
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
