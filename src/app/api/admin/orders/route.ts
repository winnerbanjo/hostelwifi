import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoAdminData } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function GET() {
  await requireAdmin();
  if (!hasDatabaseUrl) return NextResponse.json({ orders: demoAdminData.orders, demo: true });
  const orders = await prisma.order.findMany({
    include: { hostel: true, plan: true, voucher: true },
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return NextResponse.json({ orders });
}
