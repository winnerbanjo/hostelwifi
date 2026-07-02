import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { walletTopupSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const customer = await requireCustomer();
  const parsed = walletTopupSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const topup = await db.walletTransaction.create({
    data: {
      customerId: customer.id,
      type: "topup",
      amount: parsed.data.amount,
      status: "awaiting_confirmation",
      bankTransferReference: parsed.data.bankTransferReference,
      bankTransferProofUrl: parsed.data.bankTransferProofUrl,
      note: "Wallet top-up awaiting admin confirmation"
    }
  });

  return NextResponse.json({ topup });
}
