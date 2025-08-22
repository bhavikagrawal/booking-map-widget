"use client";

import React, { useState } from 'react';
import type { ExhibitionData, Stall } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Ticket } from 'lucide-react';
import FloorPlanCanvas from './floor-plan-canvas';
import { StallDetailsDialog } from './stall-details-dialog';

interface VisitorViewProps {
  exhibitionData: ExhibitionData;
}

export default function VisitorView({ exhibitionData }: VisitorViewProps) {
  const [scanned, setScanned] = useState(false);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);

  const handleScanQr = () => {
    setScanned(true);
  };

  const handleStallSelect = (stall: Stall) => {
    setSelectedStall(stall);
  };
  
  if (!scanned) {
    return (
      <div className="flex flex-col items-center justify-center text-center mt-16">
        <Card className="max-w-md">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
              <QrCode className="w-16 h-16 text-primary" />
            </div>
            <CardTitle className="text-2xl pt-4">Welcome to {exhibitionData.name}!</CardTitle>
            <CardDescription>Scan your ticket's QR code to access the interactive event guide.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onClick={handleScanQr} className="w-full">
              <Ticket className="mr-2 h-5 w-5" />
              Simulate QR Scan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Exhibition Guide</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Interactive Floor Plan</CardTitle>
          <CardDescription>Click on any stall to view its details and get recommendations.</CardDescription>
        </CardHeader>
        <CardContent>
          <FloorPlanCanvas
            floorPlanUrl={exhibitionData.floorPlanUrl}
            stalls={Object.values(exhibitionData.stalls)}
            mode="visitor"
            onStallSelect={handleStallSelect}
            selectedStallId={selectedStall?.id}
            className="aspect-[4/3]"
          />
        </CardContent>
      </Card>

      <StallDetailsDialog
        stall={selectedStall}
        exhibitionData={exhibitionData}
        onOpenChange={(isOpen) => { if (!isOpen) setSelectedStall(null); }}
      />
    </div>
  );
}
