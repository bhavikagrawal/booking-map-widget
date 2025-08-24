# Studio Floor Plan Widget

This document provides instructions on how to embed and use the Studio Floor Plan Widget in your web application.

## Quick Start

```html
<div id="studio-floorplan-container"></div>
<script src="/widget/studio-floorplan-widget.js"></script>
<script>
  StudioFloorPlan.init({
    clientId: "your-client-id",
    containerId: "studio-floorplan-container",
    viewType: "customer", // 'organizer' | 'customer' | 'visitor'
    floorPlanData: {
      floorPlanUrl: "https://example.com/floor.png",
      stalls: [
        {
          id: "s-1",
          number: "A1",
          name: "Coffee",
          category: "Food",
          segment: "Basic",
          x: 10,
          y: 20,
        },
        {
          id: "s-2",
          number: "B2",
          name: "Gadgets",
          category: "Electronics",
          segment: "Premium",
          x: 40,
          y: 55,
          purchased: true,
        },
      ],
    },
    handleSelectionChange: (stall) => console.log("Selected", stall),
  });
</script>
```

## Color System

Two colors globally across all modes:

- Green: Available stall (not purchased)
- Red: Purchased (not available)

Selected stalls also show a highlight ring for clarity.

## Embedding the Widget (Detailed)

1. Include the script tag:
   ```html
   <script src="/widget/studio-floorplan-widget.js"></script>
   ```
2. Add the container element:
   ```html
   <div id="studio-floorplan-container"></div>
   ```
3. Initialize:
   ```js
   StudioFloorPlan.init({
     clientId: "your-client-id",
     containerId: "studio-floorplan-container",
     viewType: "organizer",
     floorPlanData: {
       floorPlanUrl: "https://example.com/floor-plan.png",
       stalls: [],
     },
     handleFloorPlanUpdate: (data) => {
       console.log("Floor plan updated:", data);
     },
     handleSelectionChange: (selection) => {
       console.log("Stall selected:", selection);
     },
   });
   ```

## Configuration Options

| Property                | Type                                                             | Required       | Description                                                             |
| ----------------------- | ---------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------- |
| `clientId`              | `string`                                                         | Yes            | Your unique client identifier.                                          |
| `containerId`           | `string`                                                         | No             | DOM element id to mount into. Defaults to `studio-floorplan-container`. |
| `viewType`              | `'organizer'                                                     | 'customer'     | 'visitor'`                                                              | Yes                   | `organizer`: add/edit/delete. `customer`: select only. `visitor`: read‑only. |
| `floorPlanData`         | `{ floorPlanUrl: string; stalls: Stall[]; }`                     | No             | Initial image & stalls.                                                 |
| `dimensions`            | `{ width: number; height: number }`                              | No             | Fixed canvas size.                                                      |
| `interactive`           | `boolean`                                                        | No             | Zoom / pan + editing (organizer). Default `true`.                       |
| `theme`                 | `'light'                                                         | 'dark'`        | No                                                                      | Reserved for theming. |
| `handleFloorPlanUpdate` | `(data: { stalls: Stall[] }) => void`                            | No             | Fired after organizer save/delete.                                      |
| `handleSelectionChange` | `(selection: Stall                                               | null) => void` | No                                                                      | Fired on stall click. |
| `tooltipFields`         | `Array<{ id: string; label?: string; }>`                         | No             | Fields for hover tooltip.                                               |
| `dynamicFields`         | `Array<DynamicFieldDef>`                                         | No             | Extra form fields in organizer.                                         |
| `onStallSave`           | `(stall: Stall, info: { isNew: boolean; all: Stall[] }) => void` | No             | Save callback.                                                          |
| `onStallDelete`         | `(stallId: string, remaining: Stall[]) => void`                  | No             | Delete callback (organizer).                                            |

### Runtime APIs

| Method                                         | Description                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| `StudioFloorPlan.update(containerId, stalls)`  | Replace stalls list for an instance.                                  |
| `StudioFloorPlan.delete(containerId, stallId)` | Programmatically delete a stall (organizer mode). Triggers callbacks. |
| `StudioFloorPlan.getStalls(containerId)`       | Snapshot current stalls array.                                        |

### Selection Custom Event

```js
document.addEventListener("studio:stall-select", (e) => {
  const { stall } = e.detail;
  console.log("CustomEvent stall-select", stall);
});
```

## TypeScript Definitions

```ts
export interface Stall {
  id: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  number: string;
  name: string;
  category: string;
  segment: string;
  contact?: string;
  image?: string;
  description?: string;
  purchased?: boolean;
  [key: string]: any;
}

export interface FloorPlanWidgetProps {
  clientId: string;
  containerId?: string;
  viewType: "organizer" | "customer" | "visitor";
  floorPlanData?: { floorPlanUrl: string; stalls: Stall[] };
  dimensions?: { width: number; height: number };
  interactive?: boolean;
  theme?: "light" | "dark";
  handleFloorPlanUpdate?: (data: { stalls: Stall[] }) => void;
  handleSelectionChange?: (selection: Stall | null) => void;
  tooltipFields?: Array<{ id: string; label?: string }>;
  dynamicFields?: Array<{
    id: string;
    label: string;
    type?: "text" | "number" | "textarea";
    required?: boolean;
    placeholder?: string;
  }>;
  onStallSave?: (stall: Stall, info: { isNew: boolean; all: Stall[] }) => void;
  onStallDelete?: (stallId: string, remaining: Stall[]) => void;
}
```

## Simplified Three-Mode Demo

```html
<div class="tabs">
  <button data-tab="customer" class="active">Customer</button>
  <button data-tab="visitor">Visitor</button>
  <button data-tab="organizer">Organizer</button>
</div>
<div id="panel-customer" class="active"><div id="c"></div></div>
<div id="panel-visitor" style="display:none"><div id="v"></div></div>
<div id="panel-organizer" style="display:none"><div id="o"></div></div>
<script src="/widget/studio-floorplan-widget.js"></script>
<script>
  let stalls = [
    {
      id: "a",
      number: "A1",
      name: "Coffee",
      category: "Food",
      segment: "Basic",
      x: 15,
      y: 25,
    },
    {
      id: "b",
      number: "B2",
      name: "Gadget",
      category: "Electronics",
      segment: "Luxury",
      x: 45,
      y: 55,
      purchased: true,
    },
  ];
  const common = {
    clientId: "demo",
    dimensions: { width: 800, height: 600 },
    floorPlanData: { floorPlanUrl: "https://placehold.co/600x400", stalls },
  };
  StudioFloorPlan.init({
    ...common,
    containerId: "c",
    viewType: "customer",
    handleSelectionChange: (s) => console.log("cust", s),
  });
  StudioFloorPlan.init({ ...common, containerId: "v", viewType: "visitor" });
  StudioFloorPlan.init({
    ...common,
    containerId: "o",
    viewType: "organizer",
    handleFloorPlanUpdate: (d) => {
      stalls = d.stalls;
      StudioFloorPlan.update("c", stalls);
      StudioFloorPlan.update("v", stalls);
    },
    onStallDelete: (id, remain) =>
      console.log("Deleted", id, "remaining", remain.length),
  });
  document.querySelectorAll("[data-tab]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const t = btn.dataset.tab;
      document
        .querySelectorAll("[data-tab]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("panel-customer").style.display =
        t === "customer" ? "block" : "none";
      document.getElementById("panel-visitor").style.display =
        t === "visitor" ? "block" : "none";
      document.getElementById("panel-organizer").style.display =
        t === "organizer" ? "block" : "none";
      setTimeout(() => window.dispatchEvent(new Event("resize")), 20);
    })
  );
</script>
```

## Build Process

```bash
npm run build:floor-plan-widget
```

Output: `public/widget/studio-floorplan-widget.js`.

## Global Exposure

| API                            | Description                                       |
| ------------------------------ | ------------------------------------------------- |
| `init(props)`                  | Mount a new instance. Returns `{ updateStalls }`. |
| `update(containerId, stalls)`  | Replace stalls list.                              |
| `delete(containerId, stallId)` | Programmatically delete a stall.                  |
| `getStalls(containerId)`       | Get current stalls snapshot.                      |

## Troubleshooting

| Issue                                    | Cause                        | Fix                                                       |
| ---------------------------------------- | ---------------------------- | --------------------------------------------------------- |
| `StudioFloorPlan is not defined`         | Script path wrong / blocked  | Verify network 200 + correct path.                        |
| No styles                                | CSS not bundled              | Keep `globals.css` import or include your own stylesheet. |
| Image not loading                        | CORS or bad URL              | Check console/network.                                    |
| Pins misaligned after resize             | Container shown after hidden | Dispatch a resize event post-visibility.                  |
| Cannot select purchased in customer mode | Intended                     | Remove `purchased:true` from stall.                       |

## License / Attribution

Internal project component; adapt licensing as needed.
