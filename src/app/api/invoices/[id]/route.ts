import { NextResponse } from "next/server";
import { getInvoice } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Public view — strip creator token
  const { creatorToken: _, ...publicInvoice } = invoice;
  return NextResponse.json({ invoice: publicInvoice });
}
