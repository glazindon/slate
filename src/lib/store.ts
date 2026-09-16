import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import type { CreateInvoiceInput, Invoice } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "invoices.json");

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, "[]", "utf8");
  }
}

async function readAll(): Promise<Invoice[]> {
  await ensureStore();
  const raw = await fs.readFile(STORE_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(invoices: Invoice[]): Promise<void> {
  await ensureStore();
  await fs.writeFile(STORE_FILE, JSON.stringify(invoices, null, 2), "utf8");
}

export async function createInvoice(
  input: CreateInvoiceInput,
  creatorToken: string
): Promise<Invoice> {
  const now = new Date().toISOString();
  const invoice: Invoice = {
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

  const all = await readAll();
  all.unshift(invoice);
  await writeAll(all);
  return invoice;
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const all = await readAll();
  return all.find((i) => i.id === id) ?? null;
}

export async function listInvoicesByCreator(
  creatorToken: string
): Promise<Invoice[]> {
  const all = await readAll();
  return all.filter((i) => i.creatorToken === creatorToken);
}

export async function markInvoicePaid(
  id: string,
  creatorToken: string
): Promise<Invoice | null> {
  const all = await readAll();
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
  await writeAll(all);
  return all[idx];
}
