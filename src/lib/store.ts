/**
 * Invoice persistence with two backends:
 * 1. GitHub Contents API when SLATE_GITHUB_TOKEN is set (Vercel / serverless).
 * 2. Local filesystem (data/invoices.json) when the token is unset (next dev / start).
 */
import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import type { CreateInvoiceInput, Invoice } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "invoices.json");
const STORE_PATH = "data/invoices.json";
const DEFAULT_REPO = "glazindon/slate";
const DEFAULT_BRANCH = "main";
const MAX_WRITE_RETRIES = 3;

function useGitHub(): boolean {
  return Boolean(process.env.SLATE_GITHUB_TOKEN);
}

function githubConfig() {
  const token = process.env.SLATE_GITHUB_TOKEN!;
  const repo = process.env.SLATE_GITHUB_REPO || DEFAULT_REPO;
  const branch = process.env.SLATE_GITHUB_BRANCH || DEFAULT_BRANCH;
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${STORE_PATH}`;
  return { token, repo, branch, apiUrl };
}

function githubHeaders(token: string, extra?: HeadersInit): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    ...extra,
  };
}

type StoreSnapshot = { invoices: Invoice[]; sha: string | null };

function parseInvoices(raw: string): Invoice[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function ensureLocalStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, "[]", "utf8");
  }
}

async function readLocal(): Promise<StoreSnapshot> {
  await ensureLocalStore();
  const raw = await fs.readFile(STORE_FILE, "utf8");
  return { invoices: parseInvoices(raw), sha: null };
}

async function writeLocal(invoices: Invoice[]): Promise<void> {
  await ensureLocalStore();
  await fs.writeFile(STORE_FILE, JSON.stringify(invoices, null, 2), "utf8");
}

async function readGitHub(): Promise<StoreSnapshot> {
  const { token, branch, apiUrl } = githubConfig();
  const url = `${apiUrl}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, { headers: githubHeaders(token), cache: "no-store" });

  if (res.status === 404) {
    return { invoices: [], sha: null };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `GitHub Contents GET failed (${res.status}): ${body.slice(0, 200)}`
    );
  }

  const data = (await res.json()) as {
    content?: string;
    encoding?: string;
    sha?: string;
  };
  const encoded = (data.content || "").replace(/\n/g, "");
  const raw =
    data.encoding === "base64"
      ? Buffer.from(encoded, "base64").toString("utf8")
      : encoded;
  return { invoices: parseInvoices(raw), sha: data.sha ?? null };
}

async function writeGitHub(
  invoices: Invoice[],
  sha: string | null
): Promise<void> {
  const { token, branch, apiUrl } = githubConfig();
  const content = Buffer.from(
    JSON.stringify(invoices, null, 2),
    "utf8"
  ).toString("base64");
  const body: Record<string, string> = {
    message: "chore: update invoices store",
    content,
    branch,
  };
  if (sha) {
    body.sha = sha;
  }

  const res = await fetch(apiUrl, {
    method: "PUT",
    headers: githubHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });

  if (res.status === 409) {
    const err = new Error("GitHub Contents conflict") as Error & {
      status: number;
    };
    err.status = 409;
    throw err;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `GitHub Contents PUT failed (${res.status}): ${text.slice(0, 200)}`
    );
  }
}

async function readAll(): Promise<Invoice[]> {
  const snap = useGitHub() ? await readGitHub() : await readLocal();
  return snap.invoices;
}

/**
 * Read–mutate–write with GitHub SHA conflict retries.
 * Mutator may return null to abort without writing.
 */
async function updateStore(
  mutator: (invoices: Invoice[]) => Invoice[] | null
): Promise<Invoice[] | null> {
  if (!useGitHub()) {
    const { invoices } = await readLocal();
    const next = mutator(invoices);
    if (next === null) return null;
    await writeLocal(next);
    return next;
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_WRITE_RETRIES; attempt++) {
    const { invoices, sha } = await readGitHub();
    const next = mutator(invoices);
    if (next === null) return null;
    try {
      await writeGitHub(next, sha);
      return next;
    } catch (err) {
      lastError = err;
      const status = (err as { status?: number }).status;
      if (status === 409 && attempt < MAX_WRITE_RETRIES - 1) {
        continue;
      }
      throw err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("GitHub write failed");
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

  await updateStore((all) => {
    const next = [invoice, ...all];
    return next;
  });
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
  let updated: Invoice | null = null;

  const result = await updateStore((all) => {
    const idx = all.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    if (all[idx].creatorToken !== creatorToken) return null;

    const now = new Date().toISOString();
    const next = [...all];
    next[idx] = {
      ...next[idx],
      status: "paid",
      paidAt: now,
      updatedAt: now,
    };
    updated = next[idx];
    return next;
  });

  if (result === null) return null;
  return updated;
}
