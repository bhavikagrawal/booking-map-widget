"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { ExhibitionData, Stall, Floor, Venue } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Upload, Trash2, Pencil } from 'lucide-react';
import FloorPlanCanvas from './floor-plan-canvas';
import { StallModal } from './stall-modal';
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from './confirmation-dialog';
import { ManagementModal } from './management-modal';

interface OrganizerViewProps {
  exhibitionData: ExhibitionData;
  setExhibitionData: (data: ExhibitionData) => void;
}

export default function OrganizerView({ exhibitionData, setExhibitionData }: OrganizerViewProps) {
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  
  const [isStallModalOpen, setIsStallModalOpen] = useState(false);
  const [currentStall, setCurrentStall] = useState<Partial<Stall> | null>(null);

  const [isDeleteVenueConfirmOpen, setDeleteVenueConfirmOpen] = useState(false);
  const [isDeleteFloorConfirmOpen, setDeleteFloorConfirmOpen] = useState(false);

  const [managementModalState, setManagementModalState] = useState<{
    isOpen: boolean;
    type: 'venue' | 'floor' | null;
    mode: 'add' | 'edit' | null;
  }>({ isOpen: false, type: null, mode: null });

  const { toast } = useToast();

  useEffect(() => {
    if (!selectedVenueId && Object.keys(exhibitionData.venues).length > 0) {
      setSelectedVenueId(Object.keys(exhibitionData.venues)[0]);
    }
  }, [exhibitionData.venues, selectedVenueId]);

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
    } else {
      setSelectedFloorId(null);
    }
  }, [selectedVenueId, exhibitionData]);

  const currentVenue = useMemo(() => selectedVenueId ? exhibitionData.venues[selectedVenueId] : null, [selectedVenueId, exhibitionData]);
  const currentFloor = useMemo(() => selectedFloorId && currentVenue ? currentVenue.floors[selectedFloorId] : null, [selectedFloorId, currentVenue]);

  const handleSaveManagementItem = (name: string) => {
    const { type, mode } = managementModalState;
    if (!type || !mode) return;

    if (type === 'venue') {
      if (mode === 'add') {
        const newVenueId = `venue-${crypto.randomUUID()}`;
        const newExhibitionData: ExhibitionData = {
          ...exhibitionData,
          venues: {
            ...exhibitionData.venues,
            [newVenueId]: { name, floors: {} },
          },
        };
        setExhibitionData(newExhibitionData);
        setSelectedVenueId(newVenueId);
        toast({ title: "Venue Added", description: `Venue "${name}" has been created.` });
      } else if (mode === 'edit' && selectedVenueId) {
        const newExhibitionData = { ...exhibitionData };
        newExhibitionData.venues[selectedVenueId].name = name;
        setExhibitionData(newExhibitionData);
        toast({ title: "Venue Updated", description: `Venue name updated to "${name}".` });
      }
    } else if (type === 'floor') {
      if (!selectedVenueId) return;
      if (mode === 'add') {
        const newFloorId = `floor-${crypto.randomUUID()}`;
        const newExhibitionData = { ...exhibitionData };
        newExhibitionData.venues[selectedVenueId].floors[newFloorId] = { name, stalls: {}, floorPlanUrl: "" };
        setExhibitionData(newExhibitionData);
        setSelectedFloorId(newFloorId);
        toast({ title: "Floor Added", description: `Floor "${name}" has been added.` });
      } else if (mode === 'edit' && selectedFloorId) {
        const newExhibitionData = { ...exhibitionData };
        newExhibitionData.venues[selectedVenueId].floors[selectedFloorId].name = name;
        setExhibitionData(newExhibitionData);
        toast({ title: "Floor Updated", description: `Floor name updated to "${name}".` });
      }
    }
    setManagementModalState({ isOpen: false, type: null, mode: null });
  };

  const handleDeleteVenue = () => {
    if (!selectedVenueId) return;
    const { [selectedVenueId]: _, ...remainingVenues } = exhibitionData.venues;
    setExhibitionData({ ...exhibitionData, venues: remainingVenues });
    setSelectedVenueId(Object.keys(remainingVenues)[0] || null);
    setDeleteVenueConfirmOpen(false);
    toast({ title: "Venue Deleted", description: "The selected venue has been deleted." });
  };

  const handleDeleteFloor = () => {
    if (!selectedVenueId || !selectedFloorId) return;
    const { [selectedFloorId]: _, ...remainingFloors } = exhibitionData.venues[selectedVenueId].floors;
    const newExhibitionData = { ...exhibitionData };
    newExhibitionData.venues[selectedVenueId].floors = remainingFloors;
    setExhibitionData(newExhibitionData);
    setSelectedFloorId(Object.keys(remainingFloors)[0] || null);
    setDeleteFloorConfirmOpen(false);
    toast({ title: "Floor Deleted", description: "The selected floor has been deleted." });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedVenueId || !selectedFloorId) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newExhibitionData = { ...exhibitionData };
        newExhibitionData.venues[selectedVenueId].floors[selectedFloorId].floorPlanUrl = reader.result as string;
        setExhibitionData(newExhibitionData);
        toast({ title: "Floor Plan Uploaded", description: "The new floor plan is now active." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStallDraw = (stall: Omit<Stall, 'id' | 'number' | 'name' | 'category' | 'segment'>) => {
    setCurrentStall({ ...stall });
    setIsStallModalOpen(true);
  };

  const handleStallSelect = (stall: Stall) => {
    setCurrentStall(stall);
    setIsStallModalOpen(true);
  };

  const handleSaveStall = (stallToSave: Stall) => {
    if (!selectedVenueId || !selectedFloorId) return;
    const newExhibitionData = { ...exhibitionData };
    const floor = newExhibitionData.venues[selectedVenueId].floors[selectedFloorId];
    floor.stalls[stallToSave.id] = stallToSave;
    setExhibitionData(newExhibitionData);
    setIsStallModalOpen(false);
    setCurrentStall(null);
    toast({ title: "Stall Saved", description: `Stall "${stallToSave.number}" has been updated.` });
  };

  const handleDeleteStall = (stallId: string) => {
     if (!selectedVenueId || !selectedFloorId) return;
    const newExhibitionData = { ...exhibitionData };
    const floor = newExhibitionData.venues[selectedVenueId].floors[selectedFloorId];
    const stallNumber = floor.stalls[stallId]?.number;
    delete floor.stalls[stallId];
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
          <CardTitle>Venue & Floor Management</CardTitle>
          <CardDescription>Select a venue and floor to manage its details and floor plan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="venue-select" className="text-sm font-medium">Venue</label>
              <div className="flex gap-2 mt-1">
                <Select value={selectedVenueId || ""} onValueChange={setSelectedVenueId}>
                  <SelectTrigger id="venue-select">
                    <SelectValue placeholder="Select a venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(exhibitionData.venues).map(id => (
                      <SelectItem key={id} value={id}>{exhibitionData.venues[id].name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <Button aria-label="Add Venue" variant="outline" size="icon" onClick={() => setManagementModalState({ isOpen: true, type: 'venue', mode: 'add'})}><Plus className="h-4 w-4" /></Button>
                 <Button aria-label="Edit Venue" variant="outline" size="icon" disabled={!selectedVenueId} onClick={() => setManagementModalState({ isOpen: true, type: 'venue', mode: 'edit'})}><Pencil className="h-4 w-4" /></Button>
                 <Button aria-label="Delete Venue" variant="destructive" size="icon" disabled={!selectedVenueId} onClick={() => setDeleteVenueConfirmOpen(true)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <div>
              <label htmlFor="floor-select" className="text-sm font-medium">Floor</label>
              <div className="flex gap-2 mt-1">
                <Select value={selectedFloorId || ""} onValueChange={setSelectedFloorId} disabled={!selectedVenueId}>
                  <SelectTrigger id="floor-select">
                    <SelectValue placeholder="Select a floor" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentVenue && Object.keys(currentVenue.floors).map(id => (
                      <SelectItem key={id} value={id}>{currentVenue.floors[id].name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button aria-label="Add Floor" variant="outline" size="icon" onClick={() => setManagementModalState({ isOpen: true, type: 'floor', mode: 'add'})} disabled={!selectedVenueId}><Plus className="h-4 w-4" /></Button>
                <Button aria-label="Edit Floor" variant="outline" size="icon" disabled={!selectedFloorId} onClick={() => setManagementModalState({ isOpen: true, type: 'floor', mode: 'edit'})}><Pencil className="h-4 w-4" /></Button>
                <Button aria-label="Delete Floor" variant="destructive" size="icon" disabled={!selectedFloorId} onClick={() => setDeleteFloorConfirmOpen(true)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
          {selectedFloorId && (
            <div className="pt-4">
              <label htmlFor="floor-plan-upload" className="text-sm font-medium">Upload Floor Plan</label>
              <div className="relative mt-1">
                <Input id="floor-plan-upload" type="file" accept="image/*" onChange={handleFileUpload} className="pr-12" />
                <Upload className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedFloorId && currentFloor && (
        <Card>
          <CardHeader>
            <CardTitle>Interactive Floor Plan</CardTitle>
            <CardDescription>Click and drag on an empty space to draw a new stall. Click an existing stall to edit.</CardDescription>
          </CardHeader>
          <CardContent>
            <FloorPlanCanvas
              floorPlanUrl={currentFloor.floorPlanUrl}
              stalls={Object.values(currentFloor.stalls)}
              mode="organizer"
              onStallDraw={handleStallDraw}
              onStallSelect={handleStallSelect}
              selectedStallId={currentStall?.id}
            />
          </CardContent>
        </Card>
      )}

      {currentStall && selectedFloorId && (
        <StallModal
          isOpen={isStallModalOpen}
          setIsOpen={setIsStallModalOpen}
          stall={currentStall}
          onSave={handleSaveStall}
          onDelete={handleDeleteStall}
          allStalls={Object.values(currentFloor?.stalls || {})}
        />
      )}
      
      {managementModalState.isOpen && managementModalState.type && (
        <ManagementModal
          isOpen={managementModalState.isOpen}
          setIsOpen={(isOpen) => setManagementModalState({ ...managementModalState, isOpen })}
          onSave={handleSaveManagementItem}
          title={`${managementModalState.mode === 'add' ? 'Add' : 'Edit'} ${managementModalState.type === 'venue' ? 'Venue' : 'Floor'}`}
          description={`Enter a name for the ${managementModalState.type === 'venue' ? 'venue' : 'floor'}.`}
          label={`${managementModalState.type === 'venue' ? 'Venue' : 'Floor'} Name`}
          initialValue={
            managementModalState.mode === 'edit'
              ? (managementModalState.type === 'venue' ? currentVenue?.name : currentFloor?.name) || ''
              : ''
          }
        />
      )}

      <ConfirmationDialog
        open={isDeleteVenueConfirmOpen}
        onOpenChange={setDeleteVenueConfirmOpen}
        onConfirm={handleDeleteVenue}
        title="Delete Venue?"
        description={`Are you sure you want to delete the venue "${currentVenue?.name}" and all its floors? This action cannot be undone.`}
      />
      <ConfirmationDialog
        open={isDeleteFloorConfirmOpen}
        onOpenChange={setDeleteFloorConfirmOpen}
        onConfirm={handleDeleteFloor}
        title="Delete Floor?"
        description={`Are you sure you want to delete the floor "${currentFloor?.name}" and all its stalls? This action cannot be undone.`}
      />
    </div>
  );
}
