export interface Stall {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  number: string;
  name: string;
  category: string;
  segment: string;
  contact?: string;
  image?: string;
}

export interface Floor {
  name: string;
  floorPlanUrl: string;
  stalls: { [id: string]: Stall };
}

export interface Venue {
  name: string;
  floors: { [id: string]: Floor };
}

export interface ExhibitionData {
  name: string;
  venues: { [id: string]: Venue };
}
