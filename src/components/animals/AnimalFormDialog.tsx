import { useState } from "react";
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
import type { Animal } from "@/types/animal";
import { addAnimal } from "@/lib/animals";

const schema = z.object({
  tagId: z.string().min(1, "Tag is required"),
  species: z.enum(["Cattle", "Goat", "Sheep", "Poultry", "Pig", "Other"]).default("Cattle"),
  breed: z.string().optional(),
  sex: z.enum(["Male", "Female", "Unknown"]).default("Unknown"),
  birthDate: z.string().optional(),
  damId: z.string().optional(),
  sireId: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["Active", "Sold", "Dead", "Culled"]).default("Active"),
  lastWeightKg: z.coerce.number().positive().optional(),
  notes: z.string().optional(),
});

export type AnimalFormValues = z.infer<typeof schema>;

export const AnimalFormDialog = ({ onAdded }: { onAdded: () => void }) => {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<AnimalFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { species: "Cattle", sex: "Unknown", status: "Active" },
  });

  const onSubmit = (values: AnimalFormValues) => {
    const now = new Date().toISOString();
    const a: Animal = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      tagId: values.tagId.trim(),
      species: values.species,
      breed: values.breed?.trim() || undefined,
      sex: values.sex,
      birthDate: values.birthDate || undefined,
      damId: values.damId?.trim() || undefined,
      sireId: values.sireId?.trim() || undefined,
      location: values.location?.trim() || undefined,
      status: values.status,
      lastWeightKg: values.lastWeightKg,
      notes: values.notes,
    };

    const res = addAnimal(a);
    if (!res.ok) {
      toast({ title: "Duplicate tag", description: `Animal with tag ${a.tagId} already exists`, variant: "destructive" });
      return;
    }

    toast({ title: "Animal added", description: `${a.tagId} · ${a.species}` });
    reset({ species: "Cattle", sex: "Unknown", status: "Active" });
    setOpen(false);
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Add Animal</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Animal</DialogTitle>
          <DialogDescription>Record a new animal with basic details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <Label>Tag ID</Label>
            <Input placeholder="e.g. RW-12345" {...register("tagId")} />
            {errors.tagId && <p className="text-sm text-muted-foreground mt-1">Tag is required</p>}
          </div>
          <div>
            <Label>Species</Label>
            <Select defaultValue="Cattle" onValueChange={(v) => setValue("species", v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select species" />
              </SelectTrigger>
              <SelectContent>
                {(["Cattle", "Goat", "Sheep", "Poultry", "Pig", "Other"] as const).map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sex</Label>
            <Select defaultValue="Unknown" onValueChange={(v) => setValue("sex", v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select sex" />
              </SelectTrigger>
              <SelectContent>
                {(["Male", "Female", "Unknown"] as const).map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select defaultValue="Active" onValueChange={(v) => setValue("status", v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {(["Active", "Sold", "Dead", "Culled"] as const).map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Breed</Label>
            <Input placeholder="e.g. Friesian" {...register("breed")} />
          </div>
          <div>
            <Label>Birth Date</Label>
            <Input type="date" {...register("birthDate")} />
          </div>
          <div>
            <Label>Dam ID</Label>
            <Input placeholder="Mother tag" {...register("damId")} />
          </div>
          <div>
            <Label>Sire ID</Label>
            <Input placeholder="Father tag" {...register("sireId")} />
          </div>
          <div>
            <Label>Location</Label>
            <Input placeholder="Farm / Pen" {...register("location")} />
          </div>
          <div>
            <Label>Last Weight (kg)</Label>
            <Input type="number" step="0.1" placeholder="e.g. 250" {...register("lastWeightKg")} />
          </div>
          <div className="md:col-span-2">
            <Label>Notes</Label>
            <Textarea placeholder="Optional notes..." {...register("notes")} />
          </div>
          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Save Animal</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AnimalFormDialog;