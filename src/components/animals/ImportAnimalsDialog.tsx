import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { importAnimals } from "@/lib/animals";
import * as XLSX from "xlsx";

export const ImportAnimalsDialog = ({ onImported }: { onImported: () => void }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    try {
      setBusy(true);
      setFileName(file.name);
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws) as any[];
      const res = importAnimals(rows);
      toast({
        title: "Import complete",
        description: `${res.added} added, ${res.updated} updated${res.skippedNoTag ? `, ${res.skippedNoTag} skipped (missing tagId)` : ""}. Total rows: ${res.total}`,
      });
      setOpen(false);
      onImported();
    } catch (e) {
      toast({ title: "Import failed", description: String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Import Excel</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Animals</DialogTitle>
          <DialogDescription>
            Upload an .xlsx or .csv file with columns like: tagId, species, sex, status, breed, birthDate, damId, sireId, location, lastWeightKg, notes. Rows with an existing tagId will be updated; rows without tagId are skipped.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="file">Select file</Label>
            <input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="mt-2 block w-full text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              disabled={busy}
            />
            {fileName && <p className="text-xs text-muted-foreground mt-1">Selected: {fileName}</p>}
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportAnimalsDialog;