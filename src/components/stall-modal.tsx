"use client";

import React, { useState, useEffect } from 'react';
import type { Stall } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { ConfirmationDialog } from './confirmation-dialog';
import Image from 'next/image';

interface StallModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  stall: Partial<Stall> | null;
  onSave: (stall: Stall) => void;
  onDelete: (stallId: string) => void;
  allStalls: Stall[];
}

const STALL_CATEGORIES = ["Food", "Jewelry", "Electronics", "Art", "Apparel", "Services", "Other"];
const STALL_SEGMENTS = ["Basic", "Luxury", "Combo", "Premium"];

export function StallModal({ isOpen, setIsOpen, stall, onSave, onDelete, allStalls }: StallModalProps) {
  const [editedStall, setEditedStall] = useState<Partial<Stall> | null>(stall);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditedStall(stall);
    setError(null);
  }, [stall, isOpen]);
  
  const handleSave = () => {
    if (!editedStall?.number) {
        setError("Stall number is required.");
        return;
    }

    const isEditing = !!editedStall.id;
    const numberExists = allStalls.some(s => s.number === editedStall.number && s.id !== editedStall.id);
    if(numberExists) {
        setError(`Stall number "${editedStall.number}" already exists.`);
        return;
    }

    const finalStall: Stall = {
      id: editedStall.id || `stall-${crypto.randomUUID()}`,
      number: editedStall.number,
      name: editedStall.name || 'Unnamed Stall',
      category: editedStall.category || 'Other',
      segment: editedStall.segment || 'Basic',
      x: editedStall.x!,
      y: editedStall.y!,
      width: editedStall.width!,
      height: editedStall.height!,
      image: editedStall.image || '',
      contact: editedStall.contact || '',
    };
    onSave(finalStall);
  };

  const handleDelete = () => {
    if (editedStall?.id) {
        onDelete(editedStall.id);
        setDeleteConfirmOpen(false);
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedStall({ ...editedStall, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen || !editedStall) return null;

  const isNewStall = !editedStall.id;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isNewStall ? 'Add New Stall' : `Edit Stall ${editedStall.number}`}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stall-number" className="text-right">Number</Label>
            <Input id="stall-number" value={editedStall.number || ''} onChange={(e) => setEditedStall({ ...editedStall, number: e.target.value })} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stall-name" className="text-right">Name</Label>
            <Input id="stall-name" value={editedStall.name || ''} onChange={(e) => setEditedStall({ ...editedStall, name: e.target.value })} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stall-category" className="text-right">Category</Label>
            <Select value={editedStall.category} onValueChange={(value) => setEditedStall({ ...editedStall, category: value })}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {STALL_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stall-segment" className="text-right">Segment</Label>
            <Select value={editedStall.segment} onValueChange={(value) => setEditedStall({ ...editedStall, segment: value })}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a segment" />
              </SelectTrigger>
              <SelectContent>
                {STALL_SEGMENTS.map(seg => <SelectItem key={seg} value={seg}>{seg}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stall-image" className="text-right">Image</Label>
            <Input id="stall-image" type="file" accept="image/*" onChange={handleImageUpload} className="col-span-3" />
          </div>
           {editedStall.image && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-start-2 col-span-3 relative aspect-video">
                <Image src={editedStall.image} alt="Stall preview" layout="fill" objectFit="contain" className="rounded-md" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stall-contact" className="text-right">Contact</Label>
            <Input id="stall-contact" value={editedStall.contact || ''} placeholder="info@example.com" onChange={(e) => setEditedStall({ ...editedStall, contact: e.target.value })} className="col-span-3" />
          </div>
          {error && <p className="text-sm text-destructive col-span-4 text-center">{error}</p>}
        </div>
        <DialogFooter className="sm:justify-between">
            {!isNewStall ? (
                <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
            ) : <div />}
            <div className="flex gap-2">
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="button" onClick={handleSave}>Save</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmationDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDelete}
        title="Delete Stall?"
        description={`Are you sure you want to delete stall "${editedStall.number}"? This action cannot be undone.`}
    />
    </>
  );
}
