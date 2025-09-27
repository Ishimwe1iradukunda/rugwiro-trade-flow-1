export type FinancialType = "income" | "expense";

export interface FinancialRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  date: string; // ISO date string (YYYY-MM-DD)
  type: FinancialType;
  category: string;
  amount: number;
  notes?: string;
}

const STORAGE_KEY = "financial_records";

function read(): FinancialRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as FinancialRecord[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(items: FinancialRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function getFinancialRecords(): FinancialRecord[] {
  return read();
}

export function addFinancialRecord(rec: Omit<FinancialRecord, "id" | "createdAt" | "updatedAt">): FinancialRecord {
  const now = new Date().toISOString();
  const full: FinancialRecord = { id: crypto.randomUUID(), createdAt: now, updatedAt: now, ...rec };
  const items = read();
  items.unshift(full);
  write(items);
  return full;
}

export function updateFinancialRecord(id: string, patch: Partial<FinancialRecord>): FinancialRecord | null {
  const items = read();
  const idx = items.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const updated: FinancialRecord = { ...items[idx], ...patch, updatedAt: new Date().toISOString() };
  items[idx] = updated;
  write(items);
  return updated;
}

export function deleteFinancialRecord(id: string) {
  const items = read();
  write(items.filter((r) => r.id !== id));
}

export function filterFinancialRecords(type: "all" | FinancialType): FinancialRecord[] {
  const items = read();
  if (type === "all") return items;
  return items.filter((r) => r.type === type);
}

export function financialTotals(records: FinancialRecord[]) {
  const income = records.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const expense = records.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  return { income, expense, net: income - expense };
}