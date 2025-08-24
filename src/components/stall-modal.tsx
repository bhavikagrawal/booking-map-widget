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
  DialogPortal,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { ConfirmationDialog } from './confirmation-dialog';
import Image from 'next/image';

interface DynamicFieldDefinition {
  id: string;            // key stored on Stall (renamed from name)
  label: string;           // label in form
  type?: 'text' | 'number' | 'textarea';
  required?: boolean;
  placeholder?: string;
  validate?: (value: any, stall: Partial<Stall>) => string | null; // return error message or null
}

interface StallModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  stall: Partial<Stall> | null;
  onSave: (stall: Stall) => void;
  onDelete: (stallId: string) => void;
  allStalls: Stall[];
  portalContainer?: HTMLElement | null;
  // New optional props
  dynamicFields?: DynamicFieldDefinition[]; // additional custom fields
}

const STALL_CATEGORIES = ["Food", "Jewelry", "Electronics", "Art", "Apparel", "Services", "Other"];
const STALL_SEGMENTS = ["Basic", "Luxury", "Combo", "Premium"];

export function StallModal({ isOpen, setIsOpen, stall, onSave, onDelete, allStalls, portalContainer, dynamicFields = [] }: StallModalProps) {
  const [editedStall, setEditedStall] = useState<Partial<Stall> | null>(stall);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string,string | null>>({});

  useEffect(() => {
    setEditedStall(stall);
    setError(null);
    setFieldErrors({});
  }, [stall, isOpen]);
  
  const validateDynamicFields = (candidate: Partial<Stall>): boolean => {
    const errs: Record<string,string|null> = {};
    for (const f of dynamicFields) {
      const v = (candidate as any)[f.id];
      if (f.required && (v === undefined || v === null || v === '')) {
        errs[f.id] = `${f.label} is required.`;
        continue;
      }
      if (f.validate) {
        const custom = f.validate(v, candidate);
        if (custom) errs[f.id] = custom;
      }
    }
    setFieldErrors(errs);
    return Object.values(errs).every(v => !v);
  };
  
  const showBaseFields = dynamicFields.length === 0;

  const handleSave = () => {
    const requireNumber = showBaseFields; // only require when showing base fields
    const generatedNumber = `S-${Math.random().toString(36).slice(2,7)}`;
    const stallNumber = editedStall?.number || (!showBaseFields ? generatedNumber : '');

    if (requireNumber && !editedStall?.number) {
        setError("Stall number is required.");
        return;
    }

    const isEditing = !!editedStall?.id;
    if (stallNumber && allStalls.some(s => s.number === stallNumber && s.id !== editedStall?.id)) {
        setError(`Stall number "${stallNumber}" already exists.`);
        return;
    }

    // Validate dynamic fields
    if (!validateDynamicFields(editedStall || {})) return;

    const finalStall: Stall = {
      id: editedStall?.id || `stall-${crypto.randomUUID()}`,
      number: stallNumber || generatedNumber,
      name: editedStall?.name || 'Unnamed Stall',
      category: editedStall?.category || 'Other',
      segment: editedStall?.segment || 'Basic',
      x: editedStall!.x!,
      y: editedStall!.y!,
      image: editedStall?.image || '',
      contact: editedStall?.contact || '',
      description: editedStall?.description || '',
      ...dynamicFields.reduce((acc, f) => { acc[f.id] = (editedStall as any)?.[f.id]; return acc; }, {} as Record<string, any>)
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

  const renderDynamicField = (field: DynamicFieldDefinition) => {
    const value = (editedStall as any)[field.id] ?? '';
    const commonProps = {
      id: `stall-dyn-${field.id}`,
      value,
      placeholder: field.placeholder || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditedStall({ ...editedStall, [field.id]: e.target.value })
    };
    if (field.type === 'textarea') {
      return (
        <div className="grid grid-cols-4 items-start gap-4" key={field.id}>
          <Label htmlFor={commonProps.id} className="text-right pt-2">{field.label}</Label>
          <textarea className="col-span-3 border rounded-md p-2 min-h-[80px]" {...commonProps as any} />
          {fieldErrors[field.id] && <p className="col-span-4 col-start-2 text-xs text-destructive">{fieldErrors[field.id]}</p>}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-4 items-center gap-4" key={field.id}>
        <Label htmlFor={commonProps.id} className="text-right">{field.label}</Label>
        <Input type={field.type === 'number' ? 'number' : 'text'} className="col-span-3" {...commonProps as any} />
        {fieldErrors[field.id] && <p className="col-span-4 col-start-2 text-xs text-destructive">{fieldErrors[field.id]}</p>}
      </div>
    );
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogPortal container={portalContainer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isNewStall ? 'Add New Stall' : `Edit Stall ${editedStall.number}`}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            {showBaseFields && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stall-number" className="text-right">Number</Label>
                  <Input id="stall-number" value={editedStall?.number || ''} onChange={(e) => setEditedStall({ ...editedStall!, number: e.target.value })} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stall-name" className="text-right">Name</Label>
                  <Input id="stall-name" value={editedStall?.name || ''} onChange={(e) => setEditedStall({ ...editedStall!, name: e.target.value })} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stall-category" className="text-right">Category</Label>
                  <Select value={editedStall?.category} onValueChange={(value) => setEditedStall({ ...editedStall!, category: value })}>
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
                  <Select value={editedStall?.segment} onValueChange={(value) => setEditedStall({ ...editedStall!, segment: value })}>
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
                {editedStall?.image && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="col-start-2 col-span-3 relative aspect-video">
                      <Image src={editedStall.image} alt="Stall preview" layout="fill" objectFit="contain" className="rounded-md" />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="stall-description" className="text-right pt-2">Description</Label>
                  <textarea id="stall-description" className="col-span-3 border rounded-md p-2 min-h-[80px]" value={editedStall?.description || ''} onChange={(e) => setEditedStall({ ...editedStall!, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stall-contact" className="text-right">Contact</Label>
                  <Input id="stall-contact" value={editedStall?.contact || ''} placeholder="info@example.com" onChange={(e) => setEditedStall({ ...editedStall!, contact: e.target.value })} className="col-span-3" />
                </div>
              </>
            )}
            {dynamicFields.map(renderDynamicField)}
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
                  <Button type="button" onClick={handleSave} className="text-white">Save</Button>
              </div>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
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
