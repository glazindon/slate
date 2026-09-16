import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="no-print border-b border-border bg-paper/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-ink"
        >
          Slate
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3 text-sm">
          <Link
            href="/invoices"
            className="rounded-md px-3 py-1.5 text-slate hover:text-ink hover:bg-zinc-100 transition-colors"
          >
            My invoices
          </Link>
          <Link
            href="/new"
            className="rounded-md bg-ink px-3 py-1.5 text-white hover:bg-zinc-800 transition-colors"
          >
            New invoice
          </Link>
        </nav>
      </div>
    </header>
  );
}
