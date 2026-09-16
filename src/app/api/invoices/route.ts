import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createInvoice, listInvoicesByCreator } from "@/lib/store";
import { CREATOR_COOKIE, generateCreatorToken } from "@/lib/cookies";
import { validateInvoice } from "@/lib/validate";
import type { CreateInvoiceInput, Currency, InvoiceStatus } from "@/lib/types";

const CURRENCIES: Currency[] = ["USD", "CAD", "EUR", "GBP"];

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CREATOR_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ invoices: [] });
  }
  const invoices = await listInvoicesByCreator(token);
  return NextResponse.json({ invoices });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = body as Partial<CreateInvoiceInput> & { status?: InvoiceStatus };

  const errors = validateInvoice(data);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const currency = CURRENCIES.includes(data.currency as Currency)
    ? (data.currency as Currency)
    : "USD";

  const status: InvoiceStatus =
    data.status === "draft" ? "draft" : "sent";

  const cookieStore = await cookies();
  let creatorToken = cookieStore.get(CREATOR_COOKIE)?.value;
  const isNewToken = !creatorToken;
  if (!creatorToken) {
    creatorToken = generateCreatorToken();
  }

  const invoice = await createInvoice(
    {
      from: data.from!,
      billTo: data.billTo!,
      lineItems: (data.lineItems ?? []).filter(
        (i) => i.description?.trim() && Number(i.quantity) > 0
      ),
      currency,
      issueDate: data.issueDate!,
      dueDate: data.dueDate!,
      notes: data.notes,
      paymentInstructions: data.paymentInstructions,
      status,
    },
    creatorToken
  );

  const res = NextResponse.json({ invoice }, { status: 201 });
  if (isNewToken) {
    res.cookies.set(CREATOR_COOKIE, creatorToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}
