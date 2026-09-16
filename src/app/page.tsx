import Link from "next/link";

const benefits = [
  {
    title: "Create in one screen",
    body: "From, client, line items, due date — all in one place. No wizard, no clutter.",
  },
  {
    title: "Share a link",
    body: "Send a clean public URL. Anyone with the link can view the invoice.",
  },
  {
    title: "Mark paid when it’s paid",
    body: "When the money lands, one click updates the status. No payment processor required.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-16 sm:py-24">
      <section className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wider text-muted mb-4">
          Slate
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl md:text-6xl leading-[1.1] tracking-tight text-ink">
          Invoices that don’t get in your way.
        </h1>
        <p className="mt-6 text-lg sm:text-xl leading-relaxed text-slate max-w-xl">
          Create an invoice, share a link, get paid. Built for freelancers and
          small businesses who just want to send the bill and move on.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/new"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-ink px-6 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            Create your first invoice
          </Link>
          <Link
            href="/invoices"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-paper px-6 text-sm font-medium text-ink hover:bg-zinc-50 transition-colors"
          >
            My invoices
          </Link>
        </div>
      </section>

      <section className="mt-20 grid gap-6 sm:grid-cols-3">
        {benefits.map((b) => (
          <div
            key={b.title}
            className="rounded-2xl border border-border bg-paper p-6 shadow-sm"
          >
            <h2 className="text-base font-semibold text-ink">{b.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">{b.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
