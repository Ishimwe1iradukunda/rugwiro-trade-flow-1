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
import { addFinancialRecord } from "@/lib/financial";

const schema = z.object({
  date: z.string().min(1, "Date is required"),
  type: z.enum(["income", "expense"]).default("income"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  notes: z.string().optional(),
});

export type FinancialFormValues = z.infer<typeof schema>;

export const FinancialRecordDialog = ({ onAdded }: { onAdded: () => void }) => {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FinancialFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().slice(0,10), type: "income" },
  });

  const onSubmit = (values: FinancialFormValues) => {
    addFinancialRecord({
      date: values.date,
      type: values.type,
      category: values.category.trim(),
      amount: values.amount,
      notes: values.notes?.trim() || undefined,
    });
    toast({ title: "Record added", description: `${values.type === 'income' ? 'Income' : 'Expense'} · ${values.category}` });
    reset({ date: new Date().toISOString().slice(0,10), type: "income", category: "", amount: 0, notes: "" } as any);
    setOpen(false);
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-black text-white hover:bg-black/90">+ Add Record</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Financial Record</DialogTitle>
          <DialogDescription>Record an income or expense entry.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <Label>Date</Label>
            <Input type="date" {...register("date")} />
            {errors.date && <p className="text-sm text-muted-foreground mt-1">Date is required</p>}
          </div>
          <div>
            <Label>Type</Label>
            <Select defaultValue="income" onValueChange={(v) => setValue("type", v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Input placeholder="e.g. Feed sales / Vet services / Rent" {...register("category")} />
            {errors.category && <p className="text-sm text-muted-foreground mt-1">Category is required</p>}
          </div>
          <div>
            <Label>Amount</Label>
            <Input type="number" step="0.01" placeholder="e.g. 1200" {...register("amount")} />
            {errors.amount && <p className="text-sm text-muted-foreground mt-1">Enter a positive amount</p>}
          </div>
          <div className="md:col-span-2">
            <Label>Notes</Label>
            <Textarea placeholder="Optional notes..." {...register("notes")} />
          </div>
          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Save Record</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialRecordDialog;