import { useState, useCallback, useEffect } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShipmentFormDialog } from "@/components/trade/ShipmentFormDialog";
import { ShipmentTable } from "@/components/trade/ShipmentTable";
import {
  Home,
  PawPrint,
  Package,
  Heart,
  TrendingUp,
  DollarSign,
  Activity,
  Search,
  Printer,
  Download,
  FileSpreadsheet,
  FileDown,
  FileJson,
} from "lucide-react";
import { AnimalsTable } from "@/components/animals/AnimalsTable";
import { AnimalFormDialog } from "@/components/animals/AnimalFormDialog";
import { ImportAnimalsDialog } from "@/components/animals/ImportAnimalsDialog";
import { getAnimals } from "@/lib/animals";
import { exportAnimalsPdf } from "@/lib/animals-export";
import { FinancialRecordDialog } from "@/components/financial/FinancialRecordDialog";
import { FinancialTable } from "@/components/financial/FinancialTable";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { exportAnimalsCsv, exportAnimalsExcel, exportAnimalsJson } from "@/lib/animals-export";
import DocumentUpload from "@/components/ui/document-upload";
import * as XLSX from "xlsx";

// Add a tiny, generic editable demo list for sections without full features yet
function EditableDemoList({ section }: { section: string }) {
  const storageKey = `demo_${section}`;
  const [items, setItems] = useState<Array<{ id: string; name: string; notes?: string }>>([]);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [importErrors, setImportErrors] = useState<Array<{ rowNumber: number; name?: string; issues: string[] }> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {}
  }, [items, storageKey]);

  const addItem = () => {
    if (!name.trim()) return;
    const id = typeof window !== "undefined" && (window.crypto?.randomUUID 
      ? window.crypto.randomUUID() 
      : `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    setItems((prev) => [{ id, name: name.trim(), notes: notes.trim() || undefined }, ...prev]);
    setName("");
    setNotes("");
  };

  const updateItem = (id: string, patch: Partial<{ name: string; notes?: string }>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // ---- Import/Export helpers for demo sections (Feeds/Health/Production) ----
  const downloadTemplateCsv = () => {
    const headers = ["name","notes"];
    const csv = [headers.join(","), ["Sample item","Optional notes"].join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${section}_template.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const downloadTemplateExcel = async () => {
    const ws = XLSX.utils.json_to_sheet([{ name: "Sample item", notes: "Optional notes" }], { header: ["name","notes"] });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${section}_template.xlsx`);
  };

  const exportCsv = () => {
    const headers = ["id","name","notes"];
    const rows = items.map((it) => [it.id, it.name, it.notes ?? ""]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => {
      const v = String(c ?? "");
      return v.includes(",") || v.includes("\n") || v.includes('"') ? '"' + v.replaceAll('"','""') + '"' : v;
    }).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${section}_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${section}_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
  };

  const exportErrorsCsv = (errs: Array<{ rowNumber: number; name?: string; issues: string[] }>) => {
    const headers = ["rowNumber","name","issues"];
    const rows = errs.map((e) => [String(e.rowNumber), e.name ?? "", e.issues.join("; ")]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => {
      const v = String(c ?? "");
      return v.includes(",") || v.includes("\n") || v.includes('"') ? '"' + v.replaceAll('"','""') + '"' : v;
    }).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${section}_import_errors_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    try {
      setImportBusy(true);
      setImportErrors(null);
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws) as any[];

      // upsert by name (case-insensitive); name is required
      const byName = new Map(items.map((it) => [it.name.trim().toLowerCase(), it] as const));
      let added = 0; let updated = 0; let skipped = 0;
      const errs: Array<{ rowNumber: number; name?: string; issues: string[] }> = [];

      rows.forEach((r, idx) => {
        const rowNumber = idx + 1;
        const lower = Object.fromEntries(Object.entries(r ?? {}).map(([k,v]) => [String(k).toLowerCase(), v])) as Record<string, any>;
        const nameRaw = (r as any).name ?? lower["name"];
        const notesRaw = (r as any).notes ?? lower["notes"];
        const issues: string[] = [];
        const nameVal = typeof nameRaw === "string" ? nameRaw.trim() : String(nameRaw ?? "").trim();
        if (!nameVal) {
          issues.push("Missing name");
          skipped++;
          errs.push({ rowNumber, issues });
          return;
        }
        const patch = { name: nameVal, notes: typeof notesRaw === "string" ? notesRaw.trim() : (notesRaw ?? undefined) } as { name: string; notes?: string };
        const key = nameVal.toLowerCase();
        const existing = byName.get(key);
        if (existing) {
          existing.name = patch.name;
          existing.notes = patch.notes || existing.notes;
          updated++;
        } else {
          const id = typeof window !== "undefined" && (window.crypto?.randomUUID ? window.crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
          byName.set(key, { id, ...patch });
          added++;
        }
        if (issues.length) errs.push({ rowNumber, name: nameVal, issues });
      });

      setItems(Array.from(byName.values()).sort((a,b) => (a.name.localeCompare(b.name))));
      if (errs.length) setImportErrors(errs);
    } finally {
      setImportBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Card className="lg:col-span-7">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) addItem(); }} className="w-full rounded-md border px-3 py-2 text-sm" placeholder={`Add ${section} item name`} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm text-muted-foreground">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Optional details" rows={2} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button 
              type="button" 
              className="bg-black text-white hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={addItem}
              disabled={!name.trim()}
              title={name.trim() ? "Add item" : "Enter a name first"}
            >
              Add
            </Button>
            <span className="text-xs text-muted-foreground">Press Enter in Name to add</span>

            {/* Import/Export controls */}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={downloadTemplateExcel} disabled={importBusy}>Template (Excel)</Button>
              <Button type="button" variant="outline" size="sm" onClick={downloadTemplateCsv} disabled={importBusy}>Template (CSV)</Button>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.currentTarget.value = ""; }}
              />
              <Button type="button" variant="secondary" size="sm" disabled={importBusy} onClick={() => {
                const inp = document.createElement('input');
                inp.type = 'file'; inp.accept = '.xlsx,.xls,.csv';
                inp.onchange = () => { const f = (inp.files && inp.files[0]); if (f) handleImportFile(f); };
                inp.click();
              }}>Import</Button>
              <Button type="button" variant="outline" size="sm" onClick={exportCsv}>Export CSV</Button>
              <Button type="button" variant="outline" size="sm" onClick={exportJson}>Export JSON</Button>
            </div>
          </div>

          {importErrors && importErrors.length > 0 && (
            <div className="mt-3 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm">
              <p className="font-medium text-yellow-900">Validation issues: {importErrors.length}</p>
              <p className="text-yellow-900/80">Download a CSV report for details.</p>
              <div className="mt-2 flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => exportErrorsCsv(importErrors!)}>Download error report</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden lg:col-span-5">
        <CardContent className="p-4">
          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground">At a glance</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Total items</p>
                <p className="text-2xl font-semibold">{items.length}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Last added</p>
                <p className="truncate text-sm">{items[0]?.name || "—"}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">This panel updates live as you add, edit, or remove records.</p>
          </div>
          {/* Animated decorative graphic */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-2xl animate-pulse" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-gradient-to-tr from-emerald-500/20 via-cyan-500/20 to-blue-500/20 blur-2xl animate-pulse" />
        </CardContent>
      </Card>

      <Card className="lg:col-span-12">
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No records yet. Add your first item above.</div>
          ) : (
            <div className="grid divide-y md:divide-y-0 md:grid-cols-2 md:gap-4">
              {items.map((it) => (
                <div key={it.id} className="grid gap-3 p-4 sm:grid-cols-5 md:grid-cols-5 border md:rounded-lg md:border">
                  <input
                    value={it.name}
                    onChange={(e) => updateItem(it.id, { name: e.target.value })}
                    className="sm:col-span-2 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                  <textarea
                    value={it.notes || ""}
                    onChange={(e) => updateItem(it.id, { notes: e.target.value })}
                    className="sm:col-span-2 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                    rows={1}
                  />
                  <div className="flex items-start justify-end">
                    <Button variant="outline" onClick={() => removeItem(it.id)} className="transition-transform hover:scale-[1.02]">Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generic document uploader to simplify attaching files */}
      <Card className="lg:col-span-12">
        <CardContent className="p-4">
          <DocumentUpload
            label={`Attach ${section} documents`}
            description="Upload any related documents (images, PDFs, spreadsheets)."
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
            multiple
            maxSizeMb={25}
          />
        </CardContent>
      </Card>
    </div>
  );
}

type Section =
  | "dashboard"
  | "animals"
  | "feeds"
  | "health"
  | "production"
  | "financial"
  | "monitoring";

const Index = () => {
  const [section, setSection] = useState<Section>("financial");
  const [animalsKey, setAnimalsKey] = useState(0);
  const [financialFilter, setFinancialFilter] = useState<"all" | "income" | "expense">("all");
  const [financialKey, setFinancialKey] = useState(0);
  const refresh = useCallback(() => {
    // noop: ShipmentTable reads from localStorage and reloads itself
  }, []);

  return (
    <SidebarProvider>
      <Sidebar className="bg-white" collapsible="icon">
        <SidebarHeader>
          <div className="px-2 py-1.5 text-lg font-semibold">LivestockMS</div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setSection("dashboard")} isActive={section === "dashboard"}>
                  <Home /> <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setSection("animals")} isActive={section === "animals"}>
                  <PawPrint /> <span>Animals</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setSection("feeds")} isActive={section === "feeds"}>
                  <Package /> <span>Feeds</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setSection("health")} isActive={section === "health"}>
                  <Heart /> <span>Health</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setSection("production")} isActive={section === "production"}>
                  <TrendingUp /> <span>Production</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setSection("financial")} isActive={section === "financial"}>
                  <DollarSign /> <span>Financial</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setSection("monitoring")} isActive={section === "monitoring"}>
                  <Activity /> <span>Monitoring</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="container mx-auto flex items-center justify-between gap-3 px-4 py-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            {section === "financial" && (
              <div>
                <h1 className="text-3xl font-bold">Financial Records</h1>
                <p className="text-muted-foreground">Track income and expenses</p>
              </div>
            )}
            {section === "animals" && (
              <div>
                <h1 className="text-3xl font-bold">Animals</h1>
                <p className="text-muted-foreground">Manage your herd and records</p>
              </div>
            )}
            {section === "monitoring" && (
              <div>
                <h1 className="text-3xl font-bold">Trade Shipments</h1>
                <p className="text-muted-foreground">Monitor import & export shipments</p>
              </div>
            )}
            {section !== "financial" && section !== "monitoring" && section !== "animals" && (
              <div>
                <h1 className="text-3xl font-bold capitalize">{section}</h1>
                {section === "feeds" && (
                  <p className="text-muted-foreground">Track feed inventory, costs, and usage</p>
                )}
                {section === "health" && (
                  <p className="text-muted-foreground">Record treatments, vaccinations, and health notes</p>
                )}
                {section === "production" && (
                  <p className="text-muted-foreground">Capture daily yields and performance metrics</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {section === "financial" && (
              <FinancialRecordDialog onAdded={() => setFinancialKey((k) => k + 1)} />
            )}
            {section === "animals" && (
              <>
                <ImportAnimalsDialog onImported={() => setAnimalsKey((k) => k + 1)} />
                <AnimalFormDialog onAdded={() => setAnimalsKey((k) => k + 1)} />
                {/* Export dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => exportAnimalsPdf(getAnimals())}>
                      <Printer className="mr-2 h-4 w-4" /> PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportAnimalsExcel(getAnimals())}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel (.xlsx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportAnimalsCsv(getAnimals())}>
                      <FileDown className="mr-2 h-4 w-4" /> CSV (.csv)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportAnimalsJson(getAnimals())}>
                      <FileJson className="mr-2 h-4 w-4" /> JSON (.json)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            {section === "monitoring" && <ShipmentFormDialog onAdded={refresh} />}
          </div>
        </header>

        <main className="container mx-auto px-4 pb-10">
          {section === "financial" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Select value={financialFilter} onValueChange={(v) => setFinancialFilter(v as any)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <FinancialTable filter={financialFilter} refreshKey={financialKey} />
            </div>
          )}

          {section === "animals" && (
            <div className="space-y-6">
              <AnimalsTable refreshKey={animalsKey} />
            </div>
          )}

          {section === "monitoring" && (
            <div className="space-y-6">
              <ShipmentTable />
            </div>
          )}

          {section !== "financial" && section !== "monitoring" && section !== "animals" && (
            <EditableDemoList section={section} />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Index;