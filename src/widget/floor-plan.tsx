import React from 'react';
import ReactDOM from 'react-dom/client';
import FloorPlanCanvas from '@/components/floor-plan-canvas';
import type { Stall } from '@/lib/types';
import '@/app/globals.css';

export interface FloorPlanWidgetProps {
  clientId: string;
  containerId?: string;
  viewType: 'organizer' | 'customer' | 'visitor';
  floorPlanData?: { floorPlanUrl: string; stalls: Stall[] };
  dimensions?: { width: number; height: number };
  interactive?: boolean;
  theme?: 'light' | 'dark';
  handleFloorPlanUpdate?: (data: { stalls: Stall[] }) => void;
  handleSelectionChange?: (selection: Stall | null) => void;
  tooltipFields?: Array<{ id: string; label?: string; }>;
  dynamicFields?: Array<{ id: string; label: string; type?: 'text' | 'number' | 'textarea'; required?: boolean; placeholder?: string; }>;
  onStallSave?: (stall: Stall, info: { isNew: boolean; all: Stall[] }) => void;
  onStallDelete?: (stallId: string, remaining: Stall[]) => void; // new optional callback
}

// Internal registry for live instances to allow external updates
// @ts-ignore
if (!window.__studioFloorPlanInstances) window.__studioFloorPlanInstances = {};

function FloorPlanWidget(props: FloorPlanWidgetProps & { _containerId: string }) {
  const { viewType, floorPlanData, handleSelectionChange, handleFloorPlanUpdate, tooltipFields, dynamicFields, onStallSave, onStallDelete, _containerId } = props;
  const [stalls, setStalls] = React.useState<Stall[]>(floorPlanData?.stalls || []);
  const [selectedStallId, setSelectedStallId] = React.useState<string | null>(null);
  const [isStallModalOpen, setIsStallModalOpen] = React.useState(false);
  const [currentStall, setCurrentStall] = React.useState<Partial<Stall> | null>(null);
  const stallsRef = React.useRef<Stall[]>(stalls);

  React.useEffect(() => { setStalls(floorPlanData?.stalls || []); }, [floorPlanData?.stalls]);
  React.useEffect(() => { stallsRef.current = stalls; }, [stalls]);

  // Register updater & helpers
  React.useEffect(() => {
    // @ts-ignore
    window.__studioFloorPlanInstances[_containerId] = {
      updateStalls: (next: Stall[]) => setStalls(next),
      getStalls: () => stallsRef.current,
      deleteStall: (id: string) => {
        setStalls(prev => {
          const updated = prev.filter(s => s.id !== id);
          if (updated.length !== prev.length) {
            handleFloorPlanUpdate?.({ stalls: updated });
            onStallDelete?.(id, updated);
            if (selectedStallId === id) setSelectedStallId(null);
          }
          return updated;
        });
      }
    };
    return () => { // @ts-ignore
      delete window.__studioFloorPlanInstances[_containerId]; };
  }, [_containerId, handleFloorPlanUpdate, onStallDelete, selectedStallId]);

  const handleStallSelect = (stall: Stall) => {
    setSelectedStallId(stall.id);
    if (viewType === 'organizer') {
      setCurrentStall(stall);
      setIsStallModalOpen(true);
    }
    handleSelectionChange?.(stall);
  };

  const handlePinDrop = (stall: Omit<Stall, 'id' | 'number' | 'name' | 'category' | 'segment'>) => {
    if (viewType !== 'organizer') return;
    setCurrentStall(stall);
    setIsStallModalOpen(true);
  };

  const handleSaveStall = (stallToSave: Stall) => {
    let updatedStalls: Stall[]; let isNew = false;
    if (stallToSave.id && stalls.some(s => s.id === stallToSave.id)) {
      updatedStalls = stalls.map(s => s.id === stallToSave.id ? stallToSave : s);
    } else {
      const newStall: Stall = { ...stallToSave, id: stallToSave.id || new Date().toISOString() };
      updatedStalls = [...stalls, newStall];
      stallToSave = newStall; isNew = true;
    }
    setStalls(updatedStalls);
    handleFloorPlanUpdate?.({ stalls: updatedStalls });
    onStallSave?.(stallToSave, { isNew, all: updatedStalls });
    setIsStallModalOpen(false); setCurrentStall(null);
  };

  const handleDeleteStall = (stallId: string) => {
    const updatedStalls = stalls.filter(s => s.id !== stallId);
    setStalls(updatedStalls);
    handleFloorPlanUpdate?.({ stalls: updatedStalls });
    onStallDelete?.(stallId, updatedStalls);
    setIsStallModalOpen(false); setCurrentStall(null); setSelectedStallId(null);
    if (process.env.NODE_ENV !== 'production') console.log('[FloorPlanWidget] Deleted stall', stallId);
  };

  const canvasMode = viewType === 'organizer' ? 'organizer' : (viewType === 'customer' ? 'customer' : 'visitor');

  return (
    <div style={{ width: props.dimensions?.width, height: props.dimensions?.height }}>
      <FloorPlanCanvas
        floorPlanUrl={floorPlanData?.floorPlanUrl || ''}
        stalls={stalls}
        mode={canvasMode as any}
        onStallSelect={handleStallSelect}
        onPinDrop={viewType === 'organizer' ? handlePinDrop : undefined}
        selectedStallId={selectedStallId}
        isStallModalOpen={isStallModalOpen}
        setIsStallModalOpen={setIsStallModalOpen}
        currentStall={currentStall}
        onSaveStall={handleSaveStall}
        onDeleteStall={handleDeleteStall}
        tooltipFields={tooltipFields}
        dynamicFields={dynamicFields}
      />
    </div>
  );
}

const StudioFloorPlan = {
  init: (props: FloorPlanWidgetProps) => {
    const containerId = props.containerId || 'studio-floorplan-container';
    const container = document.getElementById(containerId);
    if (!container) { console.error(`Container with id #${containerId} not found.`); return; }
    const root = ReactDOM.createRoot(container);
    root.render(<FloorPlanWidget {...props} _containerId={containerId} />);
    return { updateStalls: (next: Stall[]) => { // @ts-ignore
      const inst = window.__studioFloorPlanInstances[containerId]; inst?.updateStalls(next); } };
  },
  update: (containerId: string, stalls: Stall[]) => { // replace stalls
    // @ts-ignore
    const inst = window.__studioFloorPlanInstances[containerId];
    if (inst) inst.updateStalls(stalls); else console.warn('No instance for', containerId);
  },
  delete: (containerId: string, stallId: string) => { // programmatic delete
    // @ts-ignore
    const inst = window.__studioFloorPlanInstances[containerId];
    if (inst && inst.deleteStall) inst.deleteStall(stallId); else console.warn('No instance/delete method for', containerId);
  },
  getStalls: (containerId: string): Stall[] | undefined => { // snapshot
    // @ts-ignore
    const inst = window.__studioFloorPlanInstances[containerId];
    return inst?.getStalls?.();
  }
};

// @ts-ignore
window.StudioFloorPlan = StudioFloorPlan;

export default StudioFloorPlan;
