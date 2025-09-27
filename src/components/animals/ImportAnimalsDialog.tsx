import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { importAnimals } from "@/lib/animals";
import * as XLSX from "xlsx";
import type { AnimalImportIssue } from "@/lib/animals";
import { downloadAnimalsImportTemplateCsv, downloadAnimalsImportTemplateExcel, exportAnimalImportErrorsCsv } from "@/lib/animals-export";

export const ImportAnimalsDialog = ({ onImported }: { onImported: () => void }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errors, setErrors] = useState<AnimalImportIssue[] | null>(null);

  const handleFile = async (file: File) => {
    try {
      setBusy(true);
      setFileName(file.name);
      setErrors(null);
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws) as any[];
      const res = importAnimals(rows);
      const baseMsg = `${res.added} added, ${res.updated} updated${res.skippedNoTag ? `, ${res.skippedNoTag} skipped (missing tagId)` : ""}. Total rows: ${res.total}`;
      if (res.errors && res.errors.length) {
        setErrors(res.errors);
        toast({
          title: "Import finished with warnings",
          description: `${baseMsg}. ${res.errors.length} row(s) have validation issues. Review below and download the error report.`,
        });
        // keep dialog open so user can download errors
      } else {
        toast({ title: "Import complete", description: baseMsg });
        setOpen(false);
        onImported();
      }
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
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => downloadAnimalsImportTemplateExcel()} disabled={busy}>
              Download template (Excel)
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => downloadAnimalsImportTemplateCsv()} disabled={busy}>
              Download template (CSV)
            </Button>
          </div>
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
          {errors && errors.length > 0 && (
            <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm">
              <p className="font-medium text-yellow-900">Validation issues found: {errors.length}</p>
              <p className="text-yellow-900/80">You can download a CSV report to review rows and reasons.</p>
              <div className="mt-2 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => exportAnimalImportErrorsCsv(errors)}
                >
                  Download error report (CSV)
                </Button>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportAnimalsDialog;