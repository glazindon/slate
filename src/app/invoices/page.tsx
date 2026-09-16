import Link from "next/link";
import { cookies } from "next/headers";
import { listInvoicesByCreator } from "@/lib/store";
import { CREATOR_COOKIE } from "@/lib/cookies";
import { formatDate, formatMoney, invoiceTotal } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

export const metadata = {
  title: "My invoices — Slate",
};

export default async function InvoicesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CREATOR_COOKIE)?.value;
  const invoices = token ? await listInvoicesByCreator(token) : [];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl text-ink tracking-tight">
            My invoices
          </h1>
          <p className="mt-2 text-muted text-[15px]">
            Invoices created in this browser. Draft · Sent · Paid
          </p>
        </div>
        <Link
          href="/new"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-ink px-4 text-sm font-medium text-white hover:bg-zinc-800 shrink-0"
        >
          New invoice
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-paper px-6 py-16 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl text-ink">
            No invoices yet
          </p>
          <p className="mt-2 text-muted text-sm max-w-sm mx-auto">
            Create an invoice in one screen, share a link, and mark it paid when
            the money lands.
          </p>
          <Link
            href="/new"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-ink px-4 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Create your first invoice
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {invoices.map((inv) => (
            <li key={inv.id}>
              <Link
                href={`/i/${inv.id}`}
                className="block rounded-xl border border-border bg-paper p-4 sm:p-5 shadow-sm hover:border-zinc-300 hover:shadow transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{inv.billTo.name}</p>
                    <p className="text-sm text-muted mt-0.5">
                      {inv.from.name} · Due {formatDate(inv.dueDate)}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <StatusBadge status={inv.status} />
                    <p className="font-mono text-sm font-medium text-ink tabular-nums">
                      {formatMoney(invoiceTotal(inv.lineItems), inv.currency)}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
