import React from 'react';
import ReactDOM from 'react-dom/client';
import OrganizerView from '@/components/organizer-view';
import VisitorView from '@/components/visitor-view';
import type { ExhibitionData } from '@/lib/types';
import type { ExhibitionAdapter } from './adapter';

export interface ExhibitionWidgetProps {
  mode: 'organizer' | 'visitor';
  eventId: string;
  adapter: ExhibitionAdapter;
  data?: ExhibitionData; // optional preloaded data
  onError?: (err: unknown) => void;
}

export function ExhibitionWidget(props: ExhibitionWidgetProps) {
  const { mode, data, adapter, eventId } = props;
  const [exhibitionData, setExhibitionData] = React.useState<ExhibitionData | null>(data || null);
  const [loading, setLoading] = React.useState(!data);
  const [error, setError] = React.useState<unknown | null>(null);

  React.useEffect(() => {
    if (!exhibitionData) {
      setLoading(true);
      adapter.load(eventId)
        .then(d => setExhibitionData(d))
        .catch(e => { setError(e); props.onError?.(e); })
        .finally(() => setLoading(false));
    }
  }, [eventId]);

  if (loading || !exhibitionData) return <div>Loading exhibition...</div>;
  if (error) return <div style={{ color: 'red' }}>Failed to load exhibition</div>;

  if (mode === 'organizer') {
    return <OrganizerView exhibitionData={exhibitionData} setExhibitionData={setExhibitionData} />;
  }
  return <VisitorView exhibitionData={exhibitionData} />;
}

// Mount helper for script tag usage
export function mount(selector: string, props: ExhibitionWidgetProps) {
  const el = document.querySelector(selector);
  if (!el) throw new Error('Mount element not found: ' + selector);
  const root = ReactDOM.createRoot(el as HTMLElement);
  root.render(<ExhibitionWidget {...props} />);
  return root;
}

// Auto-init if data-exhibition-widget attribute present
if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-exhibition-widget]')
    .forEach(node => {
      const el = node as HTMLElement & { _mounted?: boolean };
      if (el._mounted) return;
      const mode = (el.getAttribute('data-mode') as 'organizer' | 'visitor') || 'visitor';
      const eventId = el.getAttribute('data-event-id') || 'default';
      // Adapter must be provided globally beforehand
      // @ts-ignore
      const adapter: ExhibitionAdapter | undefined = window.__exhibitionAdapter;
      if (!adapter) return;
      mount('[data-exhibition-widget]', { mode, eventId, adapter });
      el._mounted = true;
    });
}
