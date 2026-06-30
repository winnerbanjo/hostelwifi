import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoPendingBankOrder } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = String(body.reason || "Payment not confirmed").trim();
  if (!hasDatabaseUrl) {
    return NextResponse.json({ order: { ...demoPendingBankOrder, paymentStatus: "rejected", orderStatus: "rejected", adminNote: reason }, demo: true });
  }
  const existing = await db.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (existing.paymentStatus !== "awaiting_bank_confirmation") {
    return NextResponse.json({ error: "Only orders awaiting bank confirmation can be rejected." }, { status: 400 });
  }
  const order = await db.order.update({
    where: { id },
    data: { paymentStatus: "rejected", orderStatus: "rejected", adminNote: reason }
  });
  await db.auditLog.create({ data: { adminUserId: admin.id, action: "reject_bank_transfer", entityType: "Order", entityId: id, metadata: { reason } } });
  return NextResponse.json({ order });
}
