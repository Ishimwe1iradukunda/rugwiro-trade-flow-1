import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Animal } from "@/types/animal";

export function exportAnimalsPdf(animals: Animal[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });
  const title = `Animals Report (${animals.length})`;
  doc.setFontSize(14);
  doc.text(title, 40, 40);

  const head = [[
    "Tag",
    "Species",
    "Sex",
    "Status",
    "Breed",
    "Birth Date",
    "Location",
    "Last Weight (kg)",
  ]];

  const body = animals.map((a) => [
    a.tagId,
    a.species,
    a.sex,
    a.status,
    a.breed || "—",
    a.birthDate || "—",
    a.location || "—",
    a.lastWeightKg != null ? String(a.lastWeightKg) : "—",
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 60,
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [33, 37, 41] },
    theme: "grid",
  });

  const fileName = `animals_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
}

// Add CSV/Excel/JSON export helpers
function downloadBlob(data: BlobPart, fileName: string, type: string) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportAnimalsCsv(animals: Animal[]) {
  const headers = [
    "id","tagId","species","sex","status","breed","birthDate","damId","sireId","location","lastWeightKg","notes","createdAt","updatedAt",
  ];
  const rows = animals.map((a) => headers.map((h) => (a as any)[h] ?? ""));
  const csv = [headers.join(","), ...rows.map((r) => r.map((cell) => {
    const v = String(cell);
    if (v.includes(",") || v.includes("\n") || v.includes('"')) {
      return '"' + v.replaceAll('"', '""') + '"';
    }
    return v;
  }).join(","))].join("\n");
  const file = `animals_${new Date().toISOString().slice(0,10)}.csv`;
  downloadBlob(csv, file, "text/csv;charset=utf-8");
}

export async function exportAnimalsJson(animals: Animal[]) {
  const file = `animals_${new Date().toISOString().slice(0,10)}.json`;
  downloadBlob(JSON.stringify(animals, null, 2), file, "application/json");
}

export async function exportAnimalsExcel(animals: Animal[]) {
  const rows = animals.map((a) => ({
    id: a.id,
    tagId: a.tagId,
    species: a.species,
    sex: a.sex,
    status: a.status,
    breed: a.breed ?? "",
    birthDate: a.birthDate ?? "",
    damId: a.damId ?? "",
    sireId: a.sireId ?? "",
    location: a.location ?? "",
    lastWeightKg: a.lastWeightKg ?? "",
    notes: a.notes ?? "",
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));
  // dynamic import to keep bundle light
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Animals");
  const file = `animals_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, file);
}