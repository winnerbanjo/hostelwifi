import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/demo-data";
import { bankTransferSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const parsed = bankTransferSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  if (!hasDatabaseUrl) {
    return NextResponse.json({
      order: {
        reference: data.reference,
        bankTransferReference: data.bankTransferReference,
        bankTransferProofUrl: data.bankTransferProofUrl,
        paymentStatus: "awaiting_bank_confirmation"
      },
      demo: true
    });
  }
  const order = await db.order.update({
    where: { reference: data.reference },
    data: {
      bankTransferReference: data.bankTransferReference,
      bankTransferProofUrl: data.bankTransferProofUrl,
      paymentStatus: "awaiting_bank_confirmation"
    }
  });
  return NextResponse.json({ order });
}
