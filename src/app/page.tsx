"use client";

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Loader2, Building2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OrganizerView from '@/components/organizer-view';
import VisitorView from '@/components/visitor-view';
import type { ExhibitionData, Stall } from '@/lib/types';
import { Toaster } from '@/components/ui/toaster';
import FloorPlanCanvas from '@/components/floor-plan-canvas';

const defaultExhibitionData: ExhibitionData = {
    name: "Tech & Art Expo",
    floorPlanUrl: "https://placehold.co/1200x800.png",
    stalls: {
        "stall-001": { id: "stall-001", x: 20, y: 30, number: "A-101", category: "Electronics", segment: "Luxury", name: "ElectroWorld", contact: "contact@electroworld.com", image: "https://placehold.co/300x200.png" },
        "stall-002": { id: "stall-002", x: 55, y: 15, number: "A-102", category: "Food", segment: "Basic", name: "Gourmet Bites", contact: "info@gourmetbites.com", image: "https://placehold.co/300x200.png" },
        "stall-003": { id: "stall-003", x: 70, y: 75, number: "B-201", category: "Jewelry", segment: "Combo", name: "Gem Palace", contact: "support@gempalace.com", image: "https://placehold.co/300x200.png" },
        "stall-004": { id: "stall-004", x: 35, y: 45, number: "C-301", category: "Art", segment: "Luxury", name: "Artistic Visions", contact: "gallery@artisticvisions.com", image: "https://placehold.co/300x200.png" },
        "stall-005": { id: "stall-005", x: 10, y: 65, number: "C-302", category: "Apparel", segment: "Basic", name: "Fashion Forward", contact: "sales@fashionforward.com", image: "https://placehold.co/300x200.png" },
        "stall-006": { id: "stall-006", x: 45, y: 45, number: "D-401", category: "Electronics", segment: "Luxury", name: "Future Gadgets", contact: "info@futuregadgets.com", image: "https://placehold.co/300x200.png" }
    }
};

export default function Home() {
    const [view, setView] = useState<'organizer' | 'visitor' | 'customer'>('organizer');
    const [exhibitionData, setExhibitionData] = useState<ExhibitionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedForPurchase, setSelectedForPurchase] = useState<Stall | null>(null);

    useEffect(() => {
        // Simulate fetching data
        setTimeout(() => {
            setExhibitionData(defaultExhibitionData);
            setLoading(false);
        }, 1000);
    }, []);

    const updateExhibitionData = (newData: ExhibitionData) => {
        setExhibitionData(newData);
    };

    const markPurchased = (stall: Stall) => {
      if (!exhibitionData) return;
      const updated: ExhibitionData = { ...exhibitionData, stalls: { ...exhibitionData.stalls, [stall.id]: { ...stall, purchased: true } } };
      setExhibitionData(updated);
      setSelectedForPurchase(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading Exhibition Navigator...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="bg-card border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Building2 className="h-7 w-7 text-primary" />
                        <h1 className="text-xl font-bold text-foreground">Exhibition Navigator</h1>
                    </div>
                    <div className="flex items-center space-x-2 p-1 bg-muted rounded-full">
                        <Button
                            onClick={() => setView('organizer')}
                            variant={view === 'organizer' ? 'default' : 'ghost'}
                            size="sm"
                            className="rounded-full"
                        >
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Organizer
                        </Button>
                        <Button
                            onClick={() => setView('customer')}
                            variant={view === 'customer' ? 'default' : 'ghost'}
                            size="sm"
                            className="rounded-full"
                        >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Customer
                        </Button>
                        <Button
                            onClick={() => setView('visitor')}
                            variant={view === 'visitor' ? 'default' : 'ghost'}
                            size="sm"
                            className="rounded-full"
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Visitor
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 flex-grow">
                {exhibitionData && (
                    view === 'organizer' ? (
                        <OrganizerView exhibitionData={exhibitionData} setExhibitionData={updateExhibitionData} />
                    ) : view === 'visitor' ? (
                        <VisitorView exhibitionData={exhibitionData} />
                    ) : (
                      <div className="space-y-4">
                        <h2 className="text-3xl font-bold tracking-tight">Select a Stall to Purchase</h2>
                        <FloorPlanCanvas
                          floorPlanUrl={exhibitionData.floorPlanUrl}
                          stalls={Object.values(exhibitionData.stalls)}
                          mode="customer"
                          onStallSelect={(s) => setSelectedForPurchase(s)}
                          selectedStallId={selectedForPurchase?.id}
                        />
                        {selectedForPurchase && !selectedForPurchase.purchased && (
                          <div className="flex gap-2">
                            <Button onClick={() => markPurchased(selectedForPurchase)} className="bg-green-600 hover:bg-green-700 text-white">Confirm Purchase ({selectedForPurchase.number})</Button>
                            <Button variant="outline" onClick={() => setSelectedForPurchase(null)}>Cancel</Button>
                          </div>
                        )}
                        {selectedForPurchase?.purchased && (
                          <p className="text-sm text-muted-foreground">Stall already purchased.</p>
                        )}
                      </div>
                    )
                )}
            </main>
            <Toaster />
        </div>
    );
}
