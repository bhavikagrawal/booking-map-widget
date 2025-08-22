
"use client";

import React, { useState } from 'react';
import type { ExhibitionData, Stall } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';
import FloorPlanCanvas from './floor-plan-canvas';
import { useToast } from "@/hooks/use-toast";

interface OrganizerViewProps {
  exhibitionData: ExhibitionData;
  setExhibitionData: (data: ExhibitionData) => void;
}

export default function OrganizerView({ exhibitionData, setExhibitionData }: OrganizerViewProps) {
  const [isStallModalOpen, setIsStallModalOpen] = useState(false);
  const [currentStall, setCurrentStall] = useState<Partial<Stall> | null>(null);

  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newExhibitionData = { 
          ...exhibitionData,
          floorPlanUrl: reader.result as string 
        };
        setExhibitionData(newExhibitionData);
        toast({ title: "Floor Plan Uploaded", description: "The new floor plan is now active." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePinDrop = (stall: Omit<Stall, 'id' | 'number' | 'name' | 'category' | 'segment'>) => {
    setCurrentStall({ ...stall });
    setIsStallModalOpen(true);
  };

  const handleStallSelect = (stall: Stall) => {
    setCurrentStall(stall);
    setIsStallModalOpen(true);
  };

  const handleSaveStall = (stallToSave: Stall) => {
    const newExhibitionData = { ...exhibitionData };
    newExhibitionData.stalls[stallToSave.id] = stallToSave;
    setExhibitionData(newExhibitionData);
    setIsStallModalOpen(false);
    setCurrentStall(null);
    toast({ title: "Stall Saved", description: `Stall "${stallToSave.number}" has been updated.` });
  };

  const handleDeleteStall = (stallId: string) => {
    const newExhibitionData = { ...exhibitionData };
    const stallNumber = newExhibitionData.stalls[stallId]?.number;
    delete newExhibitionData.stalls[stallId];
    setExhibitionData(newExhibitionData);
    setIsStallModalOpen(false);
    setCurrentStall(null);
    toast({ title: "Stall Deleted", description: `Stall "${stallNumber}" has been deleted.` });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Organizer Dashboard</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Floor Plan Management</CardTitle>
          <CardDescription>Upload a floor plan image for the exhibition.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="pt-4">
            <label htmlFor="floor-plan-upload" className="text-sm font-medium">Upload Floor Plan</label>
            <div className="relative mt-1">
              <Input id="floor-plan-upload" type="file" accept="image/*" onChange={handleFileUpload} className="pr-12" />
              <Upload className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interactive Floor Plan</CardTitle>
          <CardDescription>Click on the floor plan to drop a pin and add a new stall. Click an existing stall to edit. Use controls to zoom and pan.</CardDescription>
        </CardHeader>
        <CardContent>
          <FloorPlanCanvas
            floorPlanUrl={exhibitionData.floorPlanUrl}
            stalls={Object.values(exhibitionData.stalls)}
            mode="organizer"
            onPinDrop={handlePinDrop}
            onStallSelect={handleStallSelect}
            selectedStallId={currentStall?.id}
            isStallModalOpen={isStallModalOpen}
            setIsStallModalOpen={setIsStallModalOpen}
            currentStall={currentStall}
            onSaveStall={handleSaveStall}
            onDeleteStall={handleDeleteStall}
          />
        </CardContent>
      </Card>
    </div>
  );
}

    