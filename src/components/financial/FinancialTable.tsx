import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  deleteFinancialRecord,
  filterFinancialRecords,
  financialTotals,
  type FinancialRecord,
  type FinancialType,
} from "@/lib/financial";

function formatCurrency(n: number) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

export const FinancialTable = ({
  filter,
  refreshKey,
}: {
  filter: "all" | FinancialType;
  refreshKey: number;
}) => {
  const [rows, setRows] = useState<FinancialRecord[]>([]);

  const load = () => {
    setRows(filterFinancialRecords(filter));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, refreshKey]);

  const totals = useMemo(() => financialTotals(rows), [rows]);

  const remove = (id: string) => {
    deleteFinancialRecord(id);
    load();
  };

  if (rows.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">No records match the current filter.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold text-muted-foreground">
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-3">Category</div>
            <div className="col-span-3">Notes</div>
            <div className="col-span-1 text-right">Amount</div>
            <div className="col-span-1" />
          </div>
          <div className="divide-y">
            {rows.map((r) => (
              <div key={r.id} className="grid grid-cols-12 items-center gap-2 px-4 py-3">
                <div className="col-span-2 text-sm">{r.date}</div>
                <div className="col-span-2">
                  <span className={
                    r.type === "income"
                      ? "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700"
                      : "inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700"
                  }>
                    {r.type}
                  </span>
                </div>
                <div className="col-span-3 text-sm">{r.category}</div>
                <div className="col-span-3 truncate text-sm" title={r.notes}>{r.notes}</div>
                <div className="col-span-1 text-right text-sm font-medium">
                  {r.type === "expense" ? `- ${formatCurrency(r.amount)}` : formatCurrency(r.amount)}
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => remove(r.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-end gap-6 py-4">
          <div className="text-sm text-muted-foreground">Income: <span className="font-medium text-foreground">{formatCurrency(totals.income)}</span></div>
          <div className="text-sm text-muted-foreground">Expense: <span className="font-medium text-foreground">{formatCurrency(totals.expense)}</span></div>
          <div className={
            totals.net >= 0 ? "text-sm text-emerald-700" : "text-sm text-rose-700"
          }>
            Net: <span className="font-semibold">{formatCurrency(totals.net)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialTable;