import { statusLabel } from "@/lib/format";
import type { InvoiceStatus } from "@/lib/types";

const styles: Record<InvoiceStatus, string> = {
  draft: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  sent: "bg-amber-50 text-amber-800 ring-amber-200",
  paid: "bg-success-bg text-success ring-green-200",
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}
