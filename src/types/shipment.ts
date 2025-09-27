export type ShipmentType = "Import" | "Export";

export type ShipmentStatus =
  | "Pending"
  | "In Transit"
  | "Customs"
  | "Cleared"
  | "Delivered"
  | "Cancelled";

export interface Shipment {
  id: string;
  type: ShipmentType;
  reference: string;
  origin: string;
  destination: string;
  carrier?: string;
  status: ShipmentStatus;
  etd?: string; // ISO date
  eta?: string; // ISO date
  value?: number; // USD by default
  notes?: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}
