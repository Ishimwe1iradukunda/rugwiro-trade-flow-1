import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { addShipment } from "@/lib/storage";
import type { Shipment } from "@/types/shipment";
import { useState } from "react";

const schema = z.object({
  type: z.enum(["Import", "Export"]),
  reference: z.string().min(2),
  origin: z.string().min(2),
  destination: z.string().min(2),
  carrier: z.string().optional(),
  status: z.enum(["Pending", "In Transit", "Customs", "Cleared", "Delivered", "Cancelled"]).default("Pending"),
  etd: z.string().optional(),
  eta: z.string().optional(),
  value: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

export type ShipmentFormValues = z.infer<typeof schema>;

export function ShipmentFormDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ShipmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "Import", status: "Pending" },
  });

  const onSubmit = (values: ShipmentFormValues) => {
    const now = new Date().toISOString();
    const s: Shipment = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      type: values.type,
      reference: values.reference,
      origin: values.origin,
      destination: values.destination,
      carrier: values.carrier || undefined,
      status: values.status,
      etd: values.etd || undefined,
      eta: values.eta || undefined,
      value: values.value,
      notes: values.notes,
    };
    addShipment(s);
    toast({ title: "Shipment added", description: `${s.reference} · ${s.type}` });
    reset({ type: "Import", status: "Pending" });
    setOpen(false);
    onAdded();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero">Add Shipment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Shipment</DialogTitle>
          <DialogDescription>Capture key details for a new import or export shipment.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <Label>Type</Label>
            <Select defaultValue="Import" onValueChange={(v) => setValue("type", v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Import">Import</SelectItem>
                <SelectItem value="Export">Export</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reference</Label>
            <Input placeholder="e.g. PO-2025-0042" {...register("reference")} />
            {errors.reference && <p className="text-sm text-muted-foreground mt-1">Reference is required</p>}
          </div>
          <div>
            <Label>Origin</Label>
            <Input placeholder="e.g. Shanghai, CN" {...register("origin")} />
          </div>
          <div>
            <Label>Destination</Label>
            <Input placeholder="e.g. Kigali, RW" {...register("destination")} />
          </div>
          <div>
            <Label>Status</Label>
            <Select defaultValue="Pending" onValueChange={(v) => setValue("status", v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {(["Pending", "In Transit", "Customs", "Cleared", "Delivered", "Cancelled"] as const).map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Carrier</Label>
            <Input placeholder="e.g. Maersk" {...register("carrier")} />
          </div>
          <div>
            <Label>ETD</Label>
            <Input type="date" {...register("etd")} />
          </div>
          <div>
            <Label>ETA</Label>
            <Input type="date" {...register("eta")} />
          </div>
          <div className="md:col-span-2">
            <Label>Declared Value (USD)</Label>
            <Input type="number" step="0.01" placeholder="e.g. 15000" {...register("value")} />
          </div>
          <div className="md:col-span-2">
            <Label>Notes</Label>
            <Textarea placeholder="Optional notes..." {...register("notes")} />
          </div>
          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Save Shipment</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
