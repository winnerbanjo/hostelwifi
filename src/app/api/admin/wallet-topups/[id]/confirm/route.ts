import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const topup = await db.walletTransaction.findUnique({ where: { id }, include: { customer: true } });
  if (!topup || topup.type !== "topup") return NextResponse.json({ error: "Top-up not found." }, { status: 404 });
  if (topup.status !== "awaiting_confirmation") return NextResponse.json({ error: "Top-up has already been reviewed." }, { status: 400 });

  const customer = await db.customer.findUnique({ where: { id: topup.customerId } });
  if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  const [updated] = await db.$transaction(async (tx) => {
    const transaction = await tx.walletTransaction.update({
      where: { id },
      data: { status: "completed", reviewedByAdminId: admin.id, reviewedAt: new Date(), note: "Wallet top-up confirmed" }
    });
    await tx.customer.update({
      where: { id: topup.customerId },
      data: { walletBalance: Number(customer.walletBalance || 0) + Number(topup.amount || 0) }
    });
    await tx.auditLog.create({ data: { adminUserId: admin.id, action: "confirm", entityType: "WalletTransaction", entityId: id } });
    return [transaction];
  });

  return NextResponse.json({ topup: updated });
}
