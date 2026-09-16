import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getInvoice } from "@/lib/store";
import { CREATOR_COOKIE } from "@/lib/cookies";
import {
  formatDate,
  formatMoney,
  invoiceTotal,
  lineTotal,
} from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { InvoiceActions } from "@/components/InvoiceActions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) return { title: "Invoice not found — Slate" };
  return {
    title: `Invoice for ${invoice.billTo.name} — Slate`,
  };
}

export default async function PublicInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get(CREATOR_COOKIE)?.value;
  const isCreator = !!token && token === invoice.creatorToken;
  const total = invoiceTotal(invoice.lineItems);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <InvoiceActions
        id={invoice.id}
        status={invoice.status}
        isCreator={isCreator}
        showCreatedBanner={sp.created === "1"}
      />

      <article className="invoice-sheet relative rounded-2xl border border-border bg-paper p-6 sm:p-10 shadow-sm overflow-hidden">
        {invoice.status === "paid" && (
          <div
            className="pointer-events-none absolute right-6 top-8 sm:right-10 sm:top-12 rotate-[-12deg] border-4 border-success text-success font-bold uppercase tracking-[0.2em] text-2xl sm:text-3xl px-4 py-2 rounded opacity-80"
            aria-hidden
          >
            Paid
          </div>
        )}

        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="font-[family-name:var(--font-display)] text-3xl text-ink tracking-tight">
              Slate
            </p>
            <p className="mt-3 text-lg font-semibold text-ink">
              {invoice.from.name}
            </p>
            {invoice.from.email && (
              <p className="text-sm text-muted">{invoice.from.email}</p>
            )}
            {invoice.from.address && (
              <p className="text-sm text-muted whitespace-pre-line mt-1">
                {invoice.from.address}
              </p>
            )}
          </div>
          <div className="sm:text-right space-y-2">
            <StatusBadge status={invoice.status} />
            <p className="font-mono text-xs text-muted">#{invoice.id}</p>
            <dl className="text-sm space-y-1">
              <div className="flex sm:justify-end gap-2">
                <dt className="text-muted">Issued</dt>
                <dd className="text-ink">{formatDate(invoice.issueDate)}</dd>
              </div>
              <div className="flex sm:justify-end gap-2">
                <dt className="text-muted">Due</dt>
                <dd className="text-ink">{formatDate(invoice.dueDate)}</dd>
              </div>
            </dl>
          </div>
        </header>

        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Bill to
          </h2>
          <p className="mt-1 text-base font-medium text-ink">
            {invoice.billTo.name}
          </p>
          {invoice.billTo.email && (
            <p className="text-sm text-muted">{invoice.billTo.email}</p>
          )}
          {invoice.billTo.address && (
            <p className="text-sm text-muted whitespace-pre-line mt-1">
              {invoice.billTo.address}
            </p>
          )}
        </section>

        <section className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
                <th className="pb-2 font-semibold">Description</th>
                <th className="pb-2 font-semibold text-right w-16">Qty</th>
                <th className="pb-2 font-semibold text-right w-24">Rate</th>
                <th className="pb-2 font-semibold text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => (
                <tr key={item.id} className="border-b border-border/70">
                  <td className="py-3 text-ink pr-4">{item.description}</td>
                  <td className="py-3 text-right font-mono tabular-nums text-slate">
                    {item.quantity}
                  </td>
                  <td className="py-3 text-right font-mono tabular-nums text-slate">
                    {formatMoney(item.rate, invoice.currency)}
                  </td>
                  <td className="py-3 text-right font-mono tabular-nums text-ink">
                    {formatMoney(
                      lineTotal(item.quantity, item.rate),
                      invoice.currency
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end">
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-muted">
                Total
              </p>
              <p className="font-mono text-2xl font-semibold text-ink tabular-nums">
                {formatMoney(total, invoice.currency)}
              </p>
            </div>
          </div>
        </section>

        {(invoice.notes || invoice.paymentInstructions) && (
          <section className="mt-8 grid gap-4 sm:grid-cols-2 border-t border-border pt-6">
            {invoice.notes && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Notes
                </h3>
                <p className="mt-1 text-sm text-slate whitespace-pre-line">
                  {invoice.notes}
                </p>
              </div>
            )}
            {invoice.paymentInstructions && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Payment
                </h3>
                <p className="mt-1 text-sm text-slate whitespace-pre-line">
                  {invoice.paymentInstructions}
                </p>
              </div>
            )}
          </section>
        )}

        <footer className="mt-10 pt-4 border-t border-border text-center text-xs text-muted">
          Sent with Slate
        </footer>
      </article>
    </div>
  );
}
