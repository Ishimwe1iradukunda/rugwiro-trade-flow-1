import type { Animal } from "@/types/animal";
import { migrateAnimalsFromLocalStorageIfNeeded, replaceAllAnimals } from "@/lib/db";

const STORAGE_KEY = "livestock.animals";

export function getAnimals(): Animal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as Animal[]) : [];
    // fire-and-forget: ensure IndexedDB is populated if not yet migrated
    migrateAnimalsFromLocalStorageIfNeeded().catch(() => {});
    return list;
  } catch {
    return [];
  }
}

export function saveAnimals(list: Animal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  // mirror to IndexedDB (async, best-effort)
  migrateAnimalsFromLocalStorageIfNeeded()
    .then(() => replaceAllAnimals(list))
    .catch(() => {});
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

export type AnimalImportIssue = {
  rowNumber: number; // 1-based position within provided rows
  tagId?: string;
  issues: string[]; // human-readable validation issues
};

export function importAnimals(rows: Partial<Animal>[]) {
  const existing = getAnimals();
  const byTag = new Map(existing.map((a) => [a.tagId.trim().toLowerCase(), a] as const));
  let added = 0;
  let updated = 0;
  let skippedNoTag = 0;
  const errors: AnimalImportIssue[] = [];
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

  const allowedSex = new Set(["male", "female", "m", "f", "unknown"]);
  const allowedStatus = new Set(["active", "sold", "deceased", "inactive", "unknown"]);

  rows.forEach((r, i) => {
    const rowNumber = i + 1;
    const issues: string[] = [];

    // case-insensitive column mapping
    const lower = Object.fromEntries(Object.entries(r ?? {}).map(([k, v]) => [k.toLowerCase(), v])) as Record<string, any>;
    const tagIdRaw = (r as any).tagId ?? lower["tagid"] ?? lower["tag id"];

    if (!tagIdRaw || String(tagIdRaw).trim() === "") {
      skippedNoTag++;
      errors.push({ rowNumber, issues: ["Missing tagId"] });
      return; // cannot proceed without tagId
    }

    const tagId = String(tagIdRaw).trim();
    const key = tagId.toLowerCase();

    const sexRaw = (r as any).sex ?? lower["sex"];
    const statusRaw = (r as any).status ?? lower["status"];
    const weightRaw = (r as any).lastWeightKg ?? lower["lastweightkg"] ?? lower["last weight kg"] ?? lower["weight"];
    const birthDateRaw = (r as any).birthDate ?? lower["birthdate"] ?? lower["birth date"];

    // Validate and normalize fields
    // sex
    let sex: string | undefined = undefined;
    if (sexRaw !== undefined && sexRaw !== null && String(sexRaw).trim() !== "") {
      const s = String(sexRaw).trim().toLowerCase();
      if (allowedSex.has(s)) {
        sex = s === "m" ? "male" : s === "f" ? "female" : s;
      } else {
        issues.push(`Invalid sex: ${sexRaw}`);
      }
    }

    // status
    let status: string | undefined = undefined;
    if (statusRaw !== undefined && statusRaw !== null && String(statusRaw).trim() !== "") {
      const s = String(statusRaw).trim().toLowerCase();
      if (allowedStatus.has(s)) {
        status = s;
      } else {
        issues.push(`Invalid status: ${statusRaw}`);
      }
    }

    // weight
    let lastWeightKg = toNumber(weightRaw);
    if (weightRaw !== undefined && lastWeightKg === undefined) {
      issues.push(`Invalid number for lastWeightKg: ${weightRaw}`);
    }
    if (typeof lastWeightKg === "number" && lastWeightKg < 0) {
      issues.push(`lastWeightKg cannot be negative: ${lastWeightKg}`);
      lastWeightKg = undefined;
    }

    // birthDate
    let birthDate: string | undefined = undefined;
    if (birthDateRaw !== undefined && String(birthDateRaw).trim() !== "") {
      const d = new Date(String(birthDateRaw));
      if (isNaN(d.getTime())) {
        issues.push(`Invalid date for birthDate: ${birthDateRaw}`);
      } else {
        birthDate = d.toISOString().slice(0, 10);
      }
    }

    const patch: Partial<Animal> = cleanPatch({
      tagId,
      species: (r as any).species ?? lower["species"],
      breed: (r as any).breed ?? lower["breed"],
      sex,
      birthDate,
      damId: (r as any).damId ?? lower["damid"] ?? lower["dam id"],
      sireId: (r as any).sireId ?? lower["sireid"] ?? lower["sire id"],
      location: (r as any).location ?? lower["location"],
      status,
      lastWeightKg,
      notes: (r as any).notes ?? lower["notes"],
    });

    const existingAnimal = byTag.get(key);
    if (existingAnimal) {
      const merged: Animal = { ...existingAnimal, ...patch, updatedAt: now };
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
        sex: (patch as any).sex || "unknown",
        birthDate: patch.birthDate,
        damId: patch.damId,
        sireId: patch.sireId,
        location: patch.location,
        status: (patch as any).status || "active",
        lastWeightKg: patch.lastWeightKg,
        notes: patch.notes,
        createdAt: now,
        updatedAt: now,
      };
      existing.unshift(a);
      byTag.set(key, a);
      added++;
    }

    if (issues.length) {
      errors.push({ rowNumber, tagId, issues });
    }
  });

  saveAnimals(existing);
  return { added, updated, total: rows.length, skippedNoTag, errors };
}