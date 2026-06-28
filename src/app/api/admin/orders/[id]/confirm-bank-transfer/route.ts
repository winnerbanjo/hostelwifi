import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { completePaidOrder } from "@/lib/orders";
import { demoOrder } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!hasDatabaseUrl) return NextResponse.json({ order: demoOrder, demo: true });
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const completed = await completePaidOrder(order.reference, "bank_transfer", { confirmedBy: admin.id });
  await prisma.auditLog.create({ data: { adminUserId: admin.id, action: "confirm_bank_transfer", entityType: "Order", entityId: id } });
  return NextResponse.json({ order: completed });
}
