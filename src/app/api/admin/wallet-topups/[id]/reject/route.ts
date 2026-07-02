import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const topup = await db.walletTransaction.findUnique({ where: { id } });
  if (!topup || topup.type !== "topup") return NextResponse.json({ error: "Top-up not found." }, { status: 404 });
  if (topup.status !== "awaiting_confirmation") return NextResponse.json({ error: "Top-up has already been reviewed." }, { status: 400 });

  const updated = await db.walletTransaction.update({
    where: { id },
    data: { status: "rejected", reviewedByAdminId: admin.id, reviewedAt: new Date(), note: "Wallet top-up rejected" }
  });
  await db.auditLog.create({ data: { adminUserId: admin.id, action: "reject", entityType: "WalletTransaction", entityId: id } });

  return NextResponse.json({ topup: updated });
}
