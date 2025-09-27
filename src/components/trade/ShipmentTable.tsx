import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "./StatusBadge";
import type { Shipment, ShipmentStatus, ShipmentType } from "@/types/shipment";
import { deleteShipment, getShipments, updateShipment } from "@/lib/storage";
import { toast } from "@/hooks/use-toast";

export function DashboardStats({ shipments }: { shipments: Shipment[] }) {
  const total = shipments.length;
  const imports = shipments.filter(s => s.type === "Import").length;
  const exports = shipments.filter(s => s.type === "Export").length;
  const inTransit = shipments.filter(s => s.status === "In Transit").length;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: "Total", value: total },
        { label: "Imports", value: imports },
        { label: "Exports", value: exports },
        { label: "In Transit", value: inTransit },
      ].map((k) => (
        <Card key={k.label} className="shadow-elegant">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{k.label}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{k.value}</div></CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ShipmentTable() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"All" | ShipmentStatus>("All");
  const [tab, setTab] = useState<ShipmentType | "All">("All");

  const reload = () => setShipments(getShipments());
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return shipments.filter(s =>
      (tab === "All" || s.type === tab) &&
      (status === "All" || s.status === status) &&
      (!q || [s.reference, s.origin, s.destination, s.carrier].filter(Boolean).some(v => v!.toLowerCase().includes(ql)))
    );
  }, [shipments, q, status, tab]);

  const handleDelete = (id: string) => {
    deleteShipment(id);
    toast({ title: "Shipment removed" });
    reload();
  };

  const updateStatus = (id: string, newStatus: ShipmentStatus) => {
    updateShipment(id, { status: newStatus });
    toast({ title: "Status updated", description: newStatus });
    reload();
  };

  return (
    <section className="space-y-6">
      <DashboardStats shipments={shipments} />
      <Card className="shadow-elegant">
        <CardHeader className="pb-3">
          <CardTitle>Shipments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <Input placeholder="Search reference, origin, destination..." value={q} onChange={(e) => setQ(e.target.value)} />
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="md:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {(["All", "Pending", "In Transit", "Customs", "Cleared", "Delivered", "Cancelled"] as const).map(s => (
                  <SelectItem key={s} value={s as string}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
            <TabsList>
              {(["All", "Import", "Export"] as const).map(t => (
                <TabsTrigger key={t} value={t}>{t}</TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={tab} className="mt-4">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>ETD</TableHead>
                      <TableHead>ETA</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.reference}</TableCell>
                        <TableCell>{s.type}</TableCell>
                        <TableCell>{s.origin} → {s.destination}</TableCell>
                        <TableCell className="min-w-44">
                          <Select defaultValue={s.status} onValueChange={(v) => updateStatus(s.id, v as ShipmentStatus)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(["Pending", "In Transit", "Customs", "Cleared", "Delivered", "Cancelled"] as const).map(st => (
                                <SelectItem key={st} value={st}>{st}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{s.etd || "—"}</TableCell>
                        <TableCell>{s.eta || "—"}</TableCell>
                        <TableCell>{s.carrier || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" onClick={() => handleDelete(s.id)}>Delete</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-6">No shipments found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}
