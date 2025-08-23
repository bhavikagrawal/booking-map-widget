import type { ExhibitionData, Stall } from '@/lib/types';

export interface ExhibitionAdapter {
  load(eventId: string): Promise<ExhibitionData>;
  createStall(eventId: string, partial: Omit<Stall, 'id'>): Promise<Stall>;
  updateStall(eventId: string, stall: Stall): Promise<Stall>;
  deleteStall(eventId: string, stallId: string): Promise<void>;
  updateFloorplan?(eventId: string, file: File): Promise<string>; // returns new floorplan URL
}

export class InMemoryAdapter implements ExhibitionAdapter {
  private store: Record<string, ExhibitionData> = {};
  constructor(initial?: Record<string, ExhibitionData>) {
    if (initial) this.store = { ...initial };
  }
  async load(eventId: string) {
    if (!this.store[eventId]) throw new Error('Event not found');
    return structuredClone(this.store[eventId]);
  }
  async createStall(eventId: string, partial: Omit<Stall, 'id'>) {
    const data = this.store[eventId];
    const id = crypto.randomUUID();
    const stall: Stall = { id, ...partial } as Stall;
    data.stalls[id] = stall;
    return structuredClone(stall);
  }
  async updateStall(eventId: string, stall: Stall) {
    const data = this.store[eventId];
    data.stalls[stall.id] = stall;
    return structuredClone(stall);
  }
  async deleteStall(eventId: string, stallId: string) {
    const data = this.store[eventId];
    delete data.stalls[stallId];
  }
  async updateFloorplan(eventId: string, file: File) {
    const data = this.store[eventId];
    const url = await new Promise<string>((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.readAsDataURL(file);
    });
    data.floorPlanUrl = url;
    return url;
  }
}
