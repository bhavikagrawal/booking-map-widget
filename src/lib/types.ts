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
}

export interface ExhibitionData {
  name: string;
  floorPlanUrl: string;
  stalls: { [id: string]: Stall };
}
