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

// Add a tiny, generic editable demo list for sections without full features yet
function EditableDemoList({ section }: { section: string }) {
  const storageKey = `demo_${section}`;
  const [items, setItems] = useState<Array<{ id: string; name: string; notes?: string }>>([]);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

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
          <div className="mt-3 flex items-center gap-2">
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
          </div>
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