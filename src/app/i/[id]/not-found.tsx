import Link from "next/link";

export default function InvoiceNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-ink">
        Invoice not found
      </h1>
      <p className="mt-3 text-muted">
        This link may be wrong, or the invoice was removed.
      </p>
      <Link
        href="/new"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-ink px-4 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Create your first invoice
      </Link>
    </div>
  );
}
