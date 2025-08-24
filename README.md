# Firebase Studio

Next.js + TypeScript project with a canvas‑based Floor Plan Widget supporting organizer, customer, and visitor modes.

## Overview
- Organizer mode: add / edit / delete stalls (pins) with dynamic fields.
- Customer mode: select available (green) stalls; purchased stalls shown red.
- Visitor mode: read‑only showcase.
- Two colors globally: Green = available; Red = purchased (not available).
- Runtime APIs exposed on `window.StudioFloorPlan` for integration (update, delete, snapshot).

## Tech Stack
- Next.js (App Router)
- React / TypeScript
- Tailwind CSS (utility classes in `globals.css`)
- Radix UI primitives (dialogs, alert dialogs)

## Key Directories
- `src/app/` – Next.js routes & root layout.
- `src/components/` – UI + floor plan canvas & modals.
- `src/widget/` – Embeddable widget entry (`floor-plan.tsx`).
- `public/widget/` – Built distributable (`studio-floorplan-widget.js`).
- `public/floor-plan-widget-demo.html` – Minimal demo (3 tabs for modes).

## Development
Install & run:
```bash
npm install
npm run dev
```
Build production site:
```bash
npm run build && npm start
```

## Floor Plan Widget Quick Start
```html
<div id="studio-floorplan-container"></div>
<script src="/widget/studio-floorplan-widget.js"></script>
<script>
  StudioFloorPlan.init({
    clientId: 'your-client-id',
    containerId: 'studio-floorplan-container',
    viewType: 'customer', // 'organizer' | 'customer' | 'visitor'
    floorPlanData:{
      floorPlanUrl:'https://example.com/floor.png',
      stalls:[
        { id:'s-1', number:'A1', name:'Coffee', category:'Food', segment:'Basic', x:10, y:20 },
        { id:'s-2', number:'B2', name:'Gadgets', category:'Electronics', segment:'Premium', x:40, y:55, purchased:true }
      ]
    },
    handleSelectionChange: stall => console.log('Selected', stall)
  });
</script>
```

### Core Props
| Prop | Purpose |
|------|---------|
| `viewType` | 'organizer' | 'customer' | 'visitor'. |
| `floorPlanData` | `{ floorPlanUrl, stalls }` initial setup. |
| `handleFloorPlanUpdate` | Fired after save/delete in organizer mode with `{ stalls }`. |
| `handleSelectionChange` | Stall clicked (or null when cleared). |
| `dynamicFields` / `tooltipFields` | Customize edit form & hover tooltip. |
| `onStallSave` | Detailed save callback (new vs existing). |
| `onStallDelete` | Notified after a stall is deleted (id + remaining stalls). |

### Runtime APIs
Available globally on `window.StudioFloorPlan`:
| Method | Description |
|--------|-------------|
| `init(props)` | Mount an instance (returns `{ updateStalls }`). |
| `update(containerId, stalls)` | Replace stalls array. |
| `delete(containerId, stallId)` | Programmatically delete a stall (organizer). |
| `getStalls(containerId)` | Snapshot current stalls array. |

### Custom Event
A DOM event is dispatched on selection:
```js
document.addEventListener('studio:stall-select', e => {
  console.log('stall-select', e.detail.stall);
});
```

### Building the Widget
Generate `public/widget/studio-floorplan-widget.js`:
```bash
npm run build:floor-plan-widget
```

## Demo
Open `public/floor-plan-widget-demo.html` in a browser to see all three modes synchronized (organizer edits propagate to customer & visitor via the update API).

## Notes
- Coordinates are percentage based (0–100) relative to image dimensions.
- Purchased stalls cannot be re-selected for purchase in customer mode.
- Ensure to dispatch a window resize event after making a hidden canvas visible to correct layout.

## License
Internal / TBD.
