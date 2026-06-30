import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { completePaidOrder } from "@/lib/orders";
import { demoOrder } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!hasDatabaseUrl) return NextResponse.json({ order: demoOrder, demo: true });
  const order = await db.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.paymentStatus !== "awaiting_bank_confirmation") {
    return NextResponse.json({ error: "Only orders awaiting bank confirmation can be confirmed." }, { status: 400 });
  }
  const completed = await completePaidOrder(order.reference, "bank_transfer", { confirmedBy: admin.id });
  await db.auditLog.create({ data: { adminUserId: admin.id, action: "confirm_bank_transfer", entityType: "Order", entityId: id } });
  return NextResponse.json({ order: completed });
}
