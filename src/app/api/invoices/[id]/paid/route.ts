import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getInvoice, markInvoicePaid } from "@/lib/store";
import { CREATOR_COOKIE } from "@/lib/cookies";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(CREATOR_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getInvoice(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.creatorToken !== token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoice = await markInvoicePaid(id, token);
  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { creatorToken: _, ...publicInvoice } = invoice;
  return NextResponse.json({ invoice: publicInvoice });
}
