import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoAdminData } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function GET() {
  await requireAdmin();
  if (!hasDatabaseUrl) return NextResponse.json({ orders: demoAdminData.failedPayments, demo: true });
  const orders = await db.order.findMany({ where: { paymentStatus: "failed" }, include: { hostel: true, plan: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ orders });
}
