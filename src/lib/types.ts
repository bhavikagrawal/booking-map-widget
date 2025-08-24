export interface Stall {
  id: string;
  x: number;
  y: number;
  number: string;
  name: string;
  category: string;
  segment: string;
  contact?: string;
  image?: string;
  description?: string; // optional longer description
  purchased?: boolean; // indicates if stall has been purchased
  // Allow widget integrators to attach arbitrary additional fields (e.g. price, capacity)
  [key: string]: any;
}

export interface ExhibitionData {
  name: string;
  floorPlanUrl: string;
  stalls: { [id: string]: Stall };
}
