import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoPendingBankOrder } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { reason } = await request.json();
  if (!hasDatabaseUrl) {
    return NextResponse.json({ order: { ...demoPendingBankOrder, paymentStatus: "rejected", orderStatus: "rejected", adminNote: reason || "Rejected by admin" }, demo: true });
  }
  const order = await prisma.order.update({
    where: { id },
    data: { paymentStatus: "rejected", orderStatus: "rejected", adminNote: reason || "Rejected by admin" }
  });
  await prisma.auditLog.create({ data: { adminUserId: admin.id, action: "reject_bank_transfer", entityType: "Order", entityId: id, metadata: { reason } } });
  return NextResponse.json({ order });
}
