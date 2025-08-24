# Studio Floor Plan Widget

This document provides instructions on how to embed and use the Studio Floor Plan Widget in your web application.

## Quick Start

```html
<div id="studio-floorplan-container"></div>
<script src="/widget/studio-floorplan-widget.js"></script>
<script>
  StudioFloorPlan.init({
    clientId: 'your-client-id',
    containerId: 'studio-floorplan-container',
    viewType: 'customer',
    floorPlanData: { floorPlanUrl: 'https://example.com/floor.png', stalls: [] },
    handleSelectionChange: (stall) => console.log('Selected', stall)
  });
</script>
```

## Embedding the Widget (Detailed)

1. **Include the script tag** – host or copy the built file:
   ```html
   <script src="/widget/studio-floorplan-widget.js"></script>
   ```
2. **Add the container element**:
   ```html
   <div id="studio-floorplan-container"></div>
   ```
3. **Initialize**:
   ```js
   StudioFloorPlan.init({
     clientId: 'your-client-id',
     containerId: 'studio-floorplan-container',
     viewType: 'organizer', // or 'customer'
     floorPlanData: {
       floorPlanUrl: 'https://example.com/floor-plan.png',
       stalls: []
     },
     handleFloorPlanUpdate: (data) => {
       console.log('Floor plan updated:', data);
     },
     handleSelectionChange: (selection) => {
       console.log('Stall selected:', selection);
     }
   });
   ```

## Configuration Options

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `clientId` | `string` | Yes | Your unique client identifier (for multi-tenant usage / analytics tagging). |
| `containerId` | `string` | No | DOM element id to mount into. Defaults to `studio-floorplan-container`. |
| `viewType` | `'organizer' | 'customer'` | Yes | Organizer mode enables adding/editing/deleting stalls; customer is read-only & selection only. |
| `floorPlanData` | `{ floorPlanUrl: string; stalls: Stall[]; }` | No | Initial floor plan image URL + stall markers. Can be updated externally by re‑initializing (future direct update API TBD). |
| `dimensions` | `{ width: number; height: number }` | No | Fixed pixel dimensions; if omitted the container sizing governs canvas layout. |
| `interactive` | `boolean` | No | Toggle interactivity (zoom/pan & organizer edits). Default `true`. |
| `theme` | `'light' | 'dark'` | No | Base color theme. Currently light/dark toggles class behavior for future styling. |
| `handleFloorPlanUpdate` | `(data: { stalls: Stall[] }) => void` | No | Called after user adds/edits/deletes stalls (organizer mode). Includes full updated stall array. |
| `handleSelectionChange` | `(selection: Stall | null) => void` | No | Called whenever a stall is clicked / selected. Null when deselected (not currently emitted on blank click). |

> Note: Passing a new `floorPlanData.stalls` array in a subsequent `init` call will replace what the widget shows. A direct imperative update API may be added later.

## TypeScript Definitions

```ts
export type Stall = {
  id: string;
  number: string;
  name: string;
  category: string;
  segment: string;
  x: number; // percentage (0-100 across image width)
  y: number; // percentage (0-100 across image height)
  image?: string; // optional data URL / remote preview
  contact?: string; // optional contact info
};

export interface FloorPlanWidgetProps {
  clientId: string;
  containerId?: string;
  viewType: 'organizer' | 'customer';
  floorPlanData?: {
    floorPlanUrl: string;
    stalls: Stall[];
  };
  dimensions?: { width: number; height: number };
  interactive?: boolean;
  theme?: 'light' | 'dark';
  handleFloorPlanUpdate?: (data: { stalls: Stall[] }) => void;
  handleSelectionChange?: (selection: Stall | null) => void;
}
```

## Styling / CSS

The bundle inlines the project Tailwind-generated utility classes via the global import (`globals.css`). This allows the zoom controls & dialogs to render styled without an extra stylesheet. If you prefer a slimmer JS bundle and separate CSS:

1. Extract the CSS: build a standalone CSS output (e.g. `npm run build:widget:css`).
2. Remove the `import '@/app/globals.css'` line from `src/widget/floor-plan.tsx` and rebuild.
3. Include `<link rel="stylesheet" href="/widget/widget.css" />` in your host page **before** the widget script.

## Organizer vs Customer Mode

| Feature | Organizer | Customer |
|---------|-----------|----------|
| Select stall | Yes | Yes |
| Add new stall (click empty space) | Yes | No |
| Edit / Delete stall (modal) | Yes | No |
| Selection callback | Yes | Yes |
| Update callback (after save/delete) | Yes | No |

## Example: Dual Tabs (Customer + Organizer)

```html
<div class="tabs">
  <button data-tab="customer" class="active">Customer</button>
  <button data-tab="organizer">Organizer</button>
</div>
<div id="panel-customer"><div id="studio-floorplan-customer"></div></div>
<div id="panel-organizer" style="display:none"><div id="studio-floorplan-organizer"></div></div>
<script src="/widget/studio-floorplan-widget.js"></script>
<script>
  const base = { clientId:'demo', dimensions:{width:800,height:600} };
  let stalls = [];
  const customerCfg = { ...base, containerId:'studio-floorplan-customer', viewType:'customer', floorPlanData:{ floorPlanUrl:'/img/plan.png', stalls } };
  const organizerCfg = { ...base, containerId:'studio-floorplan-organizer', viewType:'organizer', floorPlanData:{ floorPlanUrl:'/img/plan.png', stalls }, handleFloorPlanUpdate:(d)=>{ stalls = d.stalls; } };
  let mounted = { customer:false, organizer:false };
  function mount(type){
    if(!mounted[type]){ StudioFloorPlan.init(type==='customer'?customerCfg:organizerCfg); mounted[type]=true; }
  }
  document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    const target = btn.dataset.tab;
    document.querySelectorAll('[data-tab]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-customer').style.display = target==='customer'?'block':'none';
    document.getElementById('panel-organizer').style.display = target==='organizer'?'block':'none';
    mount(target);
  }));
  mount('customer');
</script>
```

## Build Process

Build the widget:
```bash
npm run build:floor-plan-widget
```
Output: `public/widget/studio-floorplan-widget.js`.

## Global Exposure

The script registers a global `StudioFloorPlan` UMD library with an `init(props: FloorPlanWidgetProps)` method. Use `window.StudioFloorPlan` if TypeScript complains about the global symbol.

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `StudioFloorPlan is not defined` | Script path wrong or blocked | Use absolute `/widget/studio-floorplan-widget.js`, check Network 200. |
| No styles (unstyled buttons/modals) | Global CSS not bundled | Ensure `import '@/app/globals.css'` is present, or add separate `<link>` to extracted CSS. |
| Image not loading | CORS or bad URL | Check console/network; ensure proper hosting & CORS headers. |
| Pins misaligned after resize | Container size changed post-mount | Trigger a re-initialization or expose a future `resize()` API (planned). |

## License / Attribution

Internal project component; adapt licensing as needed.
