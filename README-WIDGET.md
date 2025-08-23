# Exhibition Widget

Embeddable widget version of the exhibition floor plan tool.

## Build

Install deps (once):

```bash
pnpm install # or npm install / yarn
```

Build the widget bundles (ESM, CJS, IIFE + d.ts):

```bash
pnpm build:widget
```

Outputs go to `dist/widget`:

- `index.esm.js`
- `index.cjs`
- `index.global.js` (IIFE exposing `window.ExhibitionWidget`)
- `index.d.ts`

## Usage (React / bundler)

```tsx
import { ExhibitionWidget, InMemoryAdapter } from 'dist/widget/index.esm.js';

const adapter = new InMemoryAdapter({
  event123: { name: 'My Expo', floorPlanUrl: 'floor.png', stalls: {} }
});

<ExhibitionWidget mode="organizer" eventId="event123" adapter={adapter} />
```

## Usage (Script tag)

```html
<script src="/dist/widget/index.global.js"></script>
<script>
  const adapter = new ExhibitionWidget.InMemoryAdapter({
    event1: { name: 'Sample', floorPlanUrl: 'https://placehold.co/1200x800.png', stalls: {} }
  });
  ExhibitionWidget.mount('#mount', { mode: 'visitor', eventId: 'event1', adapter });
</script>
<div id="mount"></div>
```

## Auto-init via data attribute

Provide a global adapter `window.__exhibitionAdapter` then add:

```html
<div data-exhibition-widget data-mode="visitor" data-event-id="event1"></div>
```

All elements with `data-exhibition-widget` will auto-mount.

## Adapter Interface

```ts
interface ExhibitionAdapter {
  load(eventId: string): Promise<ExhibitionData>;
  createStall(eventId: string, partial: Omit<Stall, 'id'>): Promise<Stall>;
  updateStall(eventId: string, stall: Stall): Promise<Stall>;
  deleteStall(eventId: string, stallId: string): Promise<void>;
  updateFloorplan?(eventId: string, file: File): Promise<string>; // returns new URL
}
```

Implement this interface to persist to your own backend.

## Development Demo

Run dev server:

```bash
pnpm dev
```

Open: `http://localhost:9002/widget-demo.html`

(Uses Vite-like module resolution from Next dev for the TS module; for production embed the built files.)

## TODO / Next Steps
- Extract styling to isolated CSS (optional Shadow DOM)
- Add REST adapter example
- Add messaging bridge for iframe embedding
- Provide theming tokens
