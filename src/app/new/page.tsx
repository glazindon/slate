import { InvoiceForm } from "@/components/InvoiceForm";

export const metadata = {
  title: "New invoice — Slate",
};

export default function NewInvoicePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-12">
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl text-ink tracking-tight">
          New invoice
        </h1>
        <p className="mt-2 text-muted text-[15px]">
          Fill in the essentials. Create & get a shareable link in under a
          minute.
        </p>
      </div>
      <InvoiceForm />
    </div>
  );
}
