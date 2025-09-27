import { Badge } from "@/components/ui/badge";
import { ShipmentStatus } from "@/types/shipment";

const statusMap: Record<ShipmentStatus, { label: string; variant?: "default" | "secondary" | "destructive" } & { tone: string }> = {
  Pending: { label: "Pending", variant: "secondary", tone: "" },
  "In Transit": { label: "In Transit", variant: "default", tone: "" },
  Customs: { label: "Customs Hold", variant: "secondary", tone: "" },
  Cleared: { label: "Cleared", variant: "default", tone: "" },
  Delivered: { label: "Delivered", variant: "default", tone: "" },
  Cancelled: { label: "Cancelled", variant: "destructive", tone: "" },
};

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  const m = statusMap[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
