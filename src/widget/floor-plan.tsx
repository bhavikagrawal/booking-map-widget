import React from 'react';
import ReactDOM from 'react-dom/client';
import FloorPlanCanvas from '@/components/floor-plan-canvas';
import type { Stall } from '@/lib/types';
// Add global styles for buttons, modal, utility classes when used standalone
import '@/app/globals.css';

// As per user request
export interface FloorPlanWidgetProps {
  clientId: string;
  containerId?: string;
  viewType: 'organizer' | 'customer';
  floorPlanData?: {
    floorPlanUrl: string;
    stalls: Stall[];
  };
  dimensions?: {
    width: number;
    height: number;
  };
  interactive?: boolean;
  theme?: 'light' | 'dark';
  handleFloorPlanUpdate?: (data: { stalls: Stall[] }) => void;
  handleSelectionChange?: (selection: Stall | null) => void;
  tooltipFields?: Array<{ id: string; label?: string; }>;
  dynamicFields?: Array<{ id: string; label: string; type?: 'text' | 'number' | 'textarea'; required?: boolean; placeholder?: string; }>;
  onStallSave?: (stall: Stall, info: { isNew: boolean; all: Stall[] }) => void; // new callback per save
}

function FloorPlanWidget(props: FloorPlanWidgetProps) {
  const {
    viewType,
    floorPlanData,
    handleSelectionChange,
    handleFloorPlanUpdate,
    tooltipFields,
    dynamicFields,
    onStallSave,
  } = props;

  const [stalls, setStalls] = React.useState<Stall[]>(floorPlanData?.stalls || []);
  const [selectedStallId, setSelectedStallId] = React.useState<string | null>(null);
  const [isStallModalOpen, setIsStallModalOpen] = React.useState(false);
  const [currentStall, setCurrentStall] = React.useState<Partial<Stall> | null>(null);

  React.useEffect(() => {
    setStalls(floorPlanData?.stalls || []);
  }, [floorPlanData?.stalls]);

  const handleStallSelect = (stall: Stall) => {
    setSelectedStallId(stall.id);
    if (viewType === 'organizer') {
      setCurrentStall(stall);
      setIsStallModalOpen(true);
    }
    handleSelectionChange?.(stall);
  };

  const handlePinDrop = (stall: Omit<Stall, 'id' | 'number' | 'name' | 'category' | 'segment'>) => {
    setCurrentStall(stall);
    setIsStallModalOpen(true);
  };

  const handleSaveStall = (stallToSave: Stall) => {
    let updatedStalls: Stall[];
    let isNew = false;
    if ('id' in stallToSave && stallToSave.id && stalls.some(s => s.id === stallToSave.id)) {
      updatedStalls = stalls.map(s => s.id === stallToSave.id ? stallToSave : s);
    } else {
      const newStall: Stall = {
        ...stallToSave,
        id: stallToSave.id || new Date().toISOString(),
      };
      updatedStalls = [...stalls, newStall];
      stallToSave = newStall;
      isNew = true;
    }
    setStalls(updatedStalls);
    handleFloorPlanUpdate?.({ stalls: updatedStalls });
    onStallSave?.(stallToSave, { isNew, all: updatedStalls });
    setIsStallModalOpen(false);
    setCurrentStall(null);
  };

  const handleDeleteStall = (stallId: string) => {
    const updatedStalls = stalls.filter(s => s.id !== stallId);
    setStalls(updatedStalls);
    handleFloorPlanUpdate?.({ stalls: updatedStalls });
    setIsStallModalOpen(false);
    setCurrentStall(null);
  };

  return (
    <div style={{width: props.dimensions?.width, height: props.dimensions?.height}}>
        <FloorPlanCanvas
            floorPlanUrl={floorPlanData?.floorPlanUrl || ''}
            stalls={stalls}
            mode={viewType === 'customer' ? 'visitor' : 'organizer'}
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

// Expose initialization function on a global object
const StudioFloorPlan = {
  init: (props: FloorPlanWidgetProps) => {
    const containerId = props.containerId || 'studio-floorplan-container';
    const container = document.getElementById(containerId);

    if (!container) {
      console.error(`Container with id #${containerId} not found.`);
      return;
    }

    const root = ReactDOM.createRoot(container);
    root.render(<FloorPlanWidget {...props} />);
  }
};

// @ts-ignore
window.StudioFloorPlan = StudioFloorPlan;

export default StudioFloorPlan;
