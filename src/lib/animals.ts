import type { Animal } from "@/types/animal";

const STORAGE_KEY = "livestock.animals";

export function getAnimals(): Animal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Animal[]) : [];
  } catch {
    return [];
  }
}

export function saveAnimals(list: Animal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addAnimal(a: Animal) {
  const list = getAnimals();
  // prevent duplicate tagId
  if (list.some((x) => x.tagId.trim().toLowerCase() === a.tagId.trim().toLowerCase())) {
    return { ok: false as const, reason: "duplicate" as const };
  }
  list.unshift(a);
  saveAnimals(list);
  return { ok: true as const };
}

export function updateAnimal(id: string, patch: Partial<Animal>) {
  const list = getAnimals();
  const idx = list.findIndex((x) => x.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    saveAnimals(list);
  }
}

export function deleteAnimal(id: string) {
  const list = getAnimals().filter((x) => x.id !== id);
  saveAnimals(list);
}

export function importAnimals(rows: Partial<Animal>[]) {
  const existing = getAnimals();
  const byTag = new Map(existing.map((a) => [a.tagId.trim().toLowerCase(), a] as const));
  let added = 0;
  let updated = 0;
  let skippedNoTag = 0;
  const now = new Date().toISOString();

  const toNumber = (v: any): number | undefined => {
    if (v === undefined || v === null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const cleanPatch = (patch: Partial<Animal>): Partial<Animal> => {
    const out: Partial<Animal> = {};
    for (const [k, v] of Object.entries(patch) as [keyof Animal, any][]) {
      if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) continue;
      // @ts-expect-error index signature
      out[k] = typeof v === "string" ? v.trim() : v;
    }
    return out;
  };

  for (const r of rows) {
    // case-insensitive column mapping
    const lower = Object.fromEntries(Object.entries(r ?? {}).map(([k, v]) => [k.toLowerCase(), v])) as Record<string, any>;
    const tagId = (r as any).tagId ?? lower["tagid"] ?? lower["tag id"];

    if (!tagId || String(tagId).trim() === "") {
      skippedNoTag++;
      continue;
    }

    const key = String(tagId).trim().toLowerCase();

    const patch: Partial<Animal> = cleanPatch({
      tagId: String(tagId).trim(),
      species: (r as any).species ?? lower["species"],
      breed: (r as any).breed ?? lower["breed"],
      sex: (r as any).sex ?? lower["sex"],
      birthDate: (r as any).birthDate ?? lower["birthdate"] ?? lower["birth date"],
      damId: (r as any).damId ?? lower["damid"] ?? lower["dam id"],
      sireId: (r as any).sireId ?? lower["sireid"] ?? lower["sire id"],
      location: (r as any).location ?? lower["location"],
      status: (r as any).status ?? lower["status"],
      lastWeightKg: toNumber((r as any).lastWeightKg ?? lower["lastweightkg"] ?? lower["last weight kg"] ?? lower["weight"]),
      notes: (r as any).notes ?? lower["notes"],
    });

    const existingAnimal = byTag.get(key);
    if (existingAnimal) {
      const merged: Animal = { ...existingAnimal, ...patch, updatedAt: now };
      // update in-place within existing array
      const idx = existing.findIndex((x) => x.id === existingAnimal.id);
      if (idx !== -1) existing[idx] = merged;
      byTag.set(key, merged);
      updated++;
    } else {
      const a: Animal = {
        id: (globalThis as any).crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tagId: patch.tagId!,
        species: (patch as any).species || "Cattle",
        breed: patch.breed,
        sex: (patch as any).sex || "Unknown",
        birthDate: patch.birthDate,
        damId: patch.damId,
        sireId: patch.sireId,
        location: patch.location,
        status: (patch as any).status || "Active",
        lastWeightKg: patch.lastWeightKg,
        notes: patch.notes,
        createdAt: now,
        updatedAt: now,
      };
      existing.unshift(a);
      byTag.set(key, a);
      added++;
    }
  }

  saveAnimals(existing);
  return { added, updated, total: rows.length, skippedNoTag };
}