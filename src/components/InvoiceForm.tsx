"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import {
  daysFromNowISO,
  formatMoney,
  invoiceTotal,
  todayISO,
} from "@/lib/format";
import type { Currency, InvoiceStatus } from "@/lib/types";

type DraftItem = {
  key: string;
  description: string;
  quantity: string;
  rate: string;
};

const CURRENCIES: Currency[] = ["USD", "CAD", "EUR", "GBP"];

function emptyItem(): DraftItem {
  return { key: nanoid(6), description: "", quantity: "1", rate: "" };
}

export function InvoiceForm() {
  const router = useRouter();
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(daysFromNowISO(14));
  const [notes, setNotes] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const total = useMemo(() => {
    return invoiceTotal(
      items.map((i) => ({
        quantity: Number(i.quantity) || 0,
        rate: Number(i.rate) || 0,
      }))
    );
  }, [items]);

  function updateItem(key: string, patch: Partial<DraftItem>) {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, ...patch } : i))
    );
  }

  function removeItem(key: string) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((i) => i.key !== key)));
  }

  async function submit(status: InvoiceStatus) {
    setSubmitting(true);
    setFormError("");
    setErrors({});

    const payload = {
      from: { name: fromName, email: fromEmail, address: fromAddress },
      billTo: { name: clientName, email: clientEmail, address: clientAddress },
      lineItems: items.map((i) => ({
        description: i.description,
        quantity: Number(i.quantity) || 0,
        rate: Number(i.rate) || 0,
      })),
      currency,
      issueDate,
      dueDate,
      notes,
      paymentInstructions,
      status,
    };

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setFormError(data.error || "Something went wrong");
        setSubmitting(false);
        return;
      }
      router.push(`/i/${data.invoice.id}?created=1`);
    } catch {
      setFormError("Could not save invoice. Try again.");
      setSubmitting(false);
    }
  }

  const field =
    "w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-400";
  const label = "block text-sm font-medium text-ink mb-1.5";
  const err = "mt-1 text-xs text-red-600";

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        void submit("sent");
      }}
    >
      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <section className="rounded-2xl border border-border bg-paper p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          From
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="fromName">
              Business name
            </label>
            <input
              id="fromName"
              className={field}
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Your studio or company"
              autoComplete="organization"
            />
            {errors.fromName && <p className={err}>{errors.fromName}</p>}
          </div>
          <div>
            <label className={label} htmlFor="fromEmail">
              Email
            </label>
            <input
              id="fromEmail"
              type="email"
              className={field}
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="you@studio.com"
              autoComplete="email"
            />
            {errors.fromEmail && <p className={err}>{errors.fromEmail}</p>}
          </div>
        </div>
        <div>
          <label className={label} htmlFor="fromAddress">
            Address <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="fromAddress"
            className={field + " min-h-[72px] resize-y"}
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            placeholder="Street, city, country"
            rows={2}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-paper p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Bill to
          </h2>
          <p className="mt-1 text-sm text-muted">Who’s this for?</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="clientName">
              Client name
            </label>
            <input
              id="clientName"
              className={field}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client name"
              autoComplete="name"
            />
            {errors.clientName && <p className={err}>{errors.clientName}</p>}
          </div>
          <div>
            <label className={label} htmlFor="clientEmail">
              Email
            </label>
            <input
              id="clientEmail"
              type="email"
              className={field}
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Email (optional — for your records)"
            />
            {errors.clientEmail && <p className={err}>{errors.clientEmail}</p>}
          </div>
        </div>
        <div>
          <label className={label} htmlFor="clientAddress">
            Address <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="clientAddress"
            className={field + " min-h-[72px] resize-y"}
            value={clientAddress}
            onChange={(e) => setClientAddress(e.target.value)}
            placeholder="Street, city, country"
            rows={2}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-paper p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Line items
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted" htmlFor="currency">
              Currency
            </label>
            <select
              id="currency"
              className="rounded-lg border border-border bg-paper px-2.5 py-1.5 text-sm"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errors.lineItems && <p className={err}>{errors.lineItems}</p>}

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.key}
              className="grid gap-2 sm:grid-cols-[1fr_72px_100px_36px] items-start"
            >
              <div>
                <input
                  className={field}
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.key, { description: e.target.value })
                  }
                  placeholder="What did you do?"
                  aria-label={`Item ${idx + 1} description`}
                />
                {errors[`item_${idx}_desc`] && (
                  <p className={err}>{errors[`item_${idx}_desc`]}</p>
                )}
              </div>
              <div>
                <input
                  className={field}
                  inputMode="decimal"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(item.key, { quantity: e.target.value })
                  }
                  placeholder="Qty"
                  aria-label={`Item ${idx + 1} quantity`}
                />
                {errors[`item_${idx}_qty`] && (
                  <p className={err}>{errors[`item_${idx}_qty`]}</p>
                )}
              </div>
              <div>
                <input
                  className={field}
                  inputMode="decimal"
                  value={item.rate}
                  onChange={(e) =>
                    updateItem(item.key, { rate: e.target.value })
                  }
                  placeholder="0.00"
                  aria-label={`Item ${idx + 1} rate`}
                />
                {errors[`item_${idx}_rate`] && (
                  <p className={err}>{errors[`item_${idx}_rate`]}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.key)}
                className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-zinc-100 hover:text-ink disabled:opacity-30"
                disabled={items.length <= 1}
                aria-label="Remove item"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setItems((p) => [...p, emptyItem()])}
            className="text-sm font-medium text-ink underline-offset-4 hover:underline"
          >
            Add item
          </button>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted">
              Subtotal / Total
            </p>
            <p className="font-mono text-lg font-medium text-ink tabular-nums">
              {formatMoney(total, currency)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-paper p-5 sm:p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="issueDate">
              Issue date
            </label>
            <input
              id="issueDate"
              type="date"
              className={field}
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
            {errors.issueDate && <p className={err}>{errors.issueDate}</p>}
          </div>
          <div>
            <label className={label} htmlFor="dueDate">
              Due
            </label>
            <input
              id="dueDate"
              type="date"
              className={field}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            {errors.dueDate && <p className={err}>{errors.dueDate}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-paper p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <label className={label} htmlFor="notes">
            Notes <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="notes"
            className={field + " min-h-[80px] resize-y"}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Thank you for your business."
            rows={3}
          />
        </div>
        <div>
          <label className={label} htmlFor="payment">
            Payment instructions{" "}
            <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="payment"
            className={field + " min-h-[80px] resize-y"}
            value={paymentInstructions}
            onChange={(e) => setPaymentInstructions(e.target.value)}
            placeholder="Bank transfer, PayPal, etc."
            rows={3}
          />
        </div>
      </section>

      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pb-8">
        <button
          type="button"
          disabled={submitting}
          onClick={() => void submit("draft")}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-paper px-5 text-sm font-medium text-ink hover:bg-zinc-50 disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-ink px-5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Create & get link"}
        </button>
      </div>
    </form>
  );
}
