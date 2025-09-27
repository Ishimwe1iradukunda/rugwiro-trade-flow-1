import Dexie, { Table } from "dexie";
import type { Animal } from "@/types/animal";

export class AppDB extends Dexie {
  animals!: Table<Animal, string>;

  constructor() {
    super("livestockDB");
    this.version(1).stores({
      // Primary key: id, index on tagId for fast lookup
      animals: "id, tagId",
    });
  }
}

export const db = new AppDB();

const STORAGE_KEY = "livestock.animals";

export async function migrateAnimalsFromLocalStorageIfNeeded() {
  try {
    const count = await db.animals.count();
    if (count > 0) return; // already migrated/has data

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Animal[];
    if (Array.isArray(parsed) && parsed.length) {
      await db.animals.bulkPut(parsed);
    }
  } catch {
    // ignore
  }
}

export async function replaceAllAnimals(list: Animal[]) {
  // Replace the whole table content with provided list
  await db.transaction("rw", db.animals, async () => {
    await db.animals.clear();
    if (list.length) await db.animals.bulkPut(list);
  });
}