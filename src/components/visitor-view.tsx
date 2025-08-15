"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { ExhibitionData, Stall } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, Ticket } from 'lucide-react';
import FloorPlanCanvas from './floor-plan-canvas';
import { StallDetailsDialog } from './stall-details-dialog';

interface VisitorViewProps {
  exhibitionData: ExhibitionData;
}

export default function VisitorView({ exhibitionData }: VisitorViewProps) {
  const [scanned, setScanned] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);

  useEffect(() => {
    if (scanned && !selectedVenueId && Object.keys(exhibitionData.venues).length > 0) {
      setSelectedVenueId(Object.keys(exhibitionData.venues)[0]);
    }
  }, [scanned, exhibitionData.venues, selectedVenueId]);

  useEffect(() => {
    if (selectedVenueId) {
      const venue = exhibitionData.venues[selectedVenueId];
      if (venue && Object.keys(venue.floors).length > 0) {
        if (!selectedFloorId || !venue.floors[selectedFloorId]) {
          setSelectedFloorId(Object.keys(venue.floors)[0]);
        }
      } else {
        setSelectedFloorId(null);
      }
    }
  }, [selectedVenueId, exhibitionData, selectedFloorId]);

  const currentVenue = useMemo(() => selectedVenueId ? exhibitionData.venues[selectedVenueId] : null, [selectedVenueId, exhibitionData]);
  const currentFloor = useMemo(() => selectedFloorId && currentVenue ? currentVenue.floors[selectedFloorId] : null, [selectedFloorId, currentVenue]);

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
          <CardTitle>Event Navigation</CardTitle>
          <CardDescription>Choose a venue and floor to explore the interactive map.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Venue</label>
              <Select value={selectedVenueId || ""} onValueChange={setSelectedVenueId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a venue" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(exhibitionData.venues).map(id => (
                    <SelectItem key={id} value={id}>{exhibitionData.venues[id].name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Floor</label>
              <Select value={selectedFloorId || ""} onValueChange={setSelectedFloorId} disabled={!selectedVenueId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a floor" />
                </SelectTrigger>
                <SelectContent>
                  {currentVenue && Object.keys(currentVenue.floors).map(id => (
                    <SelectItem key={id} value={id}>{currentVenue.floors[id].name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedFloorId && currentFloor ? (
        <Card>
          <CardHeader>
            <CardTitle>Interactive Floor Plan</CardTitle>
            <CardDescription>Click on any stall to view its details and get recommendations.</CardDescription>
          </CardHeader>
          <CardContent>
            <FloorPlanCanvas
              floorPlanUrl={currentFloor.floorPlanUrl}
              stalls={Object.values(currentFloor.stalls)}
              mode="visitor"
              onStallSelect={handleStallSelect}
            />
          </CardContent>
        </Card>
      ) : (
         <Card className="text-center">
            <CardHeader>
              <CardTitle>No Floor Selected</CardTitle>
              <CardDescription>Please select a venue and floor to see the floor plan.</CardDescription>
            </CardHeader>
        </Card>
      )}

      <StallDetailsDialog
        stall={selectedStall}
        exhibitionData={exhibitionData}
        onOpenChange={(isOpen) => { if (!isOpen) setSelectedStall(null); }}
      />
    </div>
  );
}
