"use client";

import React, { useState } from 'react';
import type { Stall, ExhibitionData } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Sparkles, Loader2 } from 'lucide-react';
import { getStallRecommendation } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";

interface StallDetailsDialogProps {
  stall: Stall | null;
  exhibitionData: ExhibitionData;
  onOpenChange: (open: boolean) => void;
}

export function StallDetailsDialog({ stall, exhibitionData, onOpenChange }: StallDetailsDialogProps) {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFindSimilar = async () => {
    if (!stall) return;
    setIsLoading(true);
    setRecommendation(null);
    const result = await getStallRecommendation(stall, exhibitionData);
    if (result.success && result.data) {
        setRecommendation(result.data.recommendation);
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: result.error,
        });
    }
    setIsLoading(false);
  };

  const isOpen = !!stall;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {stall && (
          <>
            <DialogHeader>
              <DialogTitle className="font-bold text-2xl">{stall.name} ({stall.number})</DialogTitle>
              <DialogDescription>{stall.contact}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="relative aspect-video w-full rounded-md overflow-hidden">
                <Image
                  src={stall.image || "https://placehold.co/600x400.png"}
                  alt={`Image of ${stall.name}`}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint="booth stall"
                />
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{stall.category}</Badge>
                <Badge variant="outline">{stall.segment}</Badge>
              </div>

              <Button onClick={handleFindSimilar} disabled={isLoading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Find Similar Stalls
              </Button>

              {recommendation && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">{recommendation}</p>
                </div>
              )}
            </div>
            <DialogFooter>
                <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
