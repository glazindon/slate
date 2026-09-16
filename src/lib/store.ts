import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { get, put } from "@vercel/blob";
import type { CreateInvoiceInput, Invoice } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "invoices.json");

function useBlobStore(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function assertStoreConfigured(): void {
  if (!useBlobStore() && process.env.VERCEL) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is required on Vercel. Create a Blob store for the slate-invoice project (Storage → Blob) so the token is injected automatically."
    );
  }
}

function invoicePath(id: string): string {
  return `invoices/${id}.json`;
}

function creatorIndexPath(creatorToken: string): string {
  // Path-safe token segment (UUIDs / nanoids are already safe)
  return `creators/${encodeURIComponent(creatorToken)}.json`;
}

async function streamToText(
  stream: ReadableStream<Uint8Array> | null
): Promise<string | null> {
  if (!stream) return null;
  return new Response(stream).text();
}

async function readBlobJson<T>(pathname: string): Promise<T | null> {
  const result = await get(pathname, {
    access: "private",
    useCache: false,
  });
  if (!result || result.stream === null) return null;
  const text = await streamToText(result.stream);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function writeBlobJson(
  pathname: string,
  value: unknown
): Promise<void> {
  await put(pathname, JSON.stringify(value), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

async function ensureFsStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, "[]", "utf8");
  }
}

async function readAllFs(): Promise<Invoice[]> {
  await ensureFsStore();
  const raw = await fs.readFile(STORE_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAllFs(invoices: Invoice[]): Promise<void> {
  await ensureFsStore();
  await fs.writeFile(STORE_FILE, JSON.stringify(invoices, null, 2), "utf8");
}

function buildInvoice(
  input: CreateInvoiceInput,
  creatorToken: string
): Invoice {
  const now = new Date().toISOString();
  return {
    id: nanoid(12),
    creatorToken,
    from: {
      name: input.from.name.trim(),
      email: input.from.email.trim(),
      address: input.from.address?.trim() || undefined,
    },
    billTo: {
      name: input.billTo.name.trim(),
      email: input.billTo.email.trim(),
      address: input.billTo.address?.trim() || undefined,
    },
    lineItems: input.lineItems.map((item) => ({
      id: nanoid(8),
      description: item.description.trim(),
      quantity: Number(item.quantity) || 0,
      rate: Number(item.rate) || 0,
    })),
    currency: input.currency,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    notes: input.notes?.trim() || undefined,
    paymentInstructions: input.paymentInstructions?.trim() || undefined,
    status: input.status ?? "sent",
    createdAt: now,
    updatedAt: now,
  };
}

async function addToCreatorIndex(
  creatorToken: string,
  invoiceId: string
): Promise<void> {
  const pathname = creatorIndexPath(creatorToken);
  const existing = (await readBlobJson<string[]>(pathname)) ?? [];
  const next = [invoiceId, ...existing.filter((id) => id !== invoiceId)].slice(
    0,
    200
  );
  await writeBlobJson(pathname, next);
}

export async function createInvoice(
  input: CreateInvoiceInput,
  creatorToken: string
): Promise<Invoice> {
  assertStoreConfigured();
  const invoice = buildInvoice(input, creatorToken);

  if (useBlobStore()) {
    await writeBlobJson(invoicePath(invoice.id), invoice);
    await addToCreatorIndex(creatorToken, invoice.id);
    return invoice;
  }

  const all = await readAllFs();
  all.unshift(invoice);
  await writeAllFs(all);
  return invoice;
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  assertStoreConfigured();

  if (useBlobStore()) {
    const invoice = await readBlobJson<Invoice>(invoicePath(id));
    if (!invoice || invoice.id !== id) return null;
    return invoice;
  }

  const all = await readAllFs();
  return all.find((i) => i.id === id) ?? null;
}

export async function listInvoicesByCreator(
  creatorToken: string
): Promise<Invoice[]> {
  assertStoreConfigured();

  if (useBlobStore()) {
    const ids =
      (await readBlobJson<string[]>(creatorIndexPath(creatorToken))) ?? [];
    const invoices: Invoice[] = [];
    for (const id of ids) {
      const inv = await getInvoice(id);
      if (inv && inv.creatorToken === creatorToken) {
        invoices.push(inv);
      }
    }
    return invoices;
  }

  const all = await readAllFs();
  return all.filter((i) => i.creatorToken === creatorToken);
}

export async function markInvoicePaid(
  id: string,
  creatorToken: string
): Promise<Invoice | null> {
  assertStoreConfigured();

  if (useBlobStore()) {
    const existing = await getInvoice(id);
    if (!existing) return null;
    if (existing.creatorToken !== creatorToken) return null;

    const now = new Date().toISOString();
    const updated: Invoice = {
      ...existing,
      status: "paid",
      paidAt: now,
      updatedAt: now,
    };
    await writeBlobJson(invoicePath(id), updated);
    return updated;
  }

  const all = await readAllFs();
  const idx = all.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  if (all[idx].creatorToken !== creatorToken) return null;

  const now = new Date().toISOString();
  all[idx] = {
    ...all[idx],
    status: "paid",
    paidAt: now,
    updatedAt: now,
  };
  await writeAllFs(all);
  return all[idx];
}
