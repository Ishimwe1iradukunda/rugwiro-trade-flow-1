export type Species = "Cattle" | "Goat" | "Sheep" | "Poultry" | "Pig" | "Other";
export type Sex = "Male" | "Female" | "Unknown";
export type AnimalStatus = "Active" | "Sold" | "Dead" | "Culled";

export interface Animal {
  id: string; // uuid
  tagId: string; // ear tag / RFID - must be unique
  species: Species;
  breed?: string;
  sex: Sex;
  birthDate?: string; // ISO date
  damId?: string; // mother tagId or id
  sireId?: string; // father tagId or id
  location?: string; // farm/pen/lot
  status: AnimalStatus;
  lastWeightKg?: number;
  notes?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}