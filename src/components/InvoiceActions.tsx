"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InvoiceStatus } from "@/lib/types";

export function InvoiceActions({
  id,
  status,
  isCreator,
  showCreatedBanner,
}: {
  id: string;
  status: InvoiceStatus;
  isCreator: boolean;
  showCreatedBanner?: boolean;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState(!!showCreatedBanner);

  async function copyLink() {
    const url = `${window.location.origin}/i/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      prompt("Copy this link:", url);
    }
  }

  async function markPaid() {
    setMarking(true);
    setError("");
    try {
      const res = await fetch(`/api/invoices/${id}/paid`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not mark as paid");
        setMarking(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Could not mark as paid");
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="no-print space-y-4 mb-6">
      {banner && (
        <div className="rounded-xl border border-border bg-paper px-4 py-3 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-medium text-ink">Invoice ready — copy link</p>
            <p className="text-sm text-muted mt-0.5">
              Anyone with the link can view this invoice.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBanner(false)}
            className="text-sm text-muted hover:text-ink self-start sm:self-auto"
            aria-label="Dismiss"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyLink()}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-paper px-4 text-sm font-medium text-ink hover:bg-zinc-50"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-paper px-4 text-sm font-medium text-ink hover:bg-zinc-50"
        >
          Print
        </button>
        {isCreator && status !== "paid" && (
          <button
            type="button"
            disabled={marking}
            onClick={() => void markPaid()}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-ink px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {marking ? "Updating…" : "Mark as paid"}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-sm text-muted">
        Anyone with the link can view this invoice.
      </p>
    </div>
  );
}
