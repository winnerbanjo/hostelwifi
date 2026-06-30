import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deliverVoucher } from "@/lib/delivery";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!hasDatabaseUrl) return NextResponse.json({ delivery: { email: { ok: true, detail: "Demo resend" } }, demo: true });
  const order = await db.order.findUnique({ where: { id }, include: { voucher: true, plan: true, hostel: true } });
  if (!order?.voucher) return NextResponse.json({ error: "Voucher not found for order" }, { status: 404 });
  const delivery = await deliverVoucher({ order, voucher: order.voucher, plan: order.plan, hostel: order.hostel });
  await db.auditLog.create({ data: { adminUserId: admin.id, action: "resend_voucher", entityType: "Order", entityId: id } });
  return NextResponse.json({ delivery });
}
