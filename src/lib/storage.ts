import { Shipment } from "@/types/shipment";

const STORAGE_KEY = "rugwiro.trade.shipments";

export function getShipments(): Shipment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Shipment[]) : [];
  } catch {
    return [];
  }
}

export function saveShipments(list: Shipment[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addShipment(s: Shipment) {
  const list = getShipments();
  list.unshift(s);
  saveShipments(list);
}

export function updateShipment(id: string, patch: Partial<Shipment>) {
  const list = getShipments();
  const idx = list.findIndex((x) => x.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    saveShipments(list);
  }
}

export function deleteShipment(id: string) {
  const list = getShipments().filter((x) => x.id !== id);
  saveShipments(list);
}
