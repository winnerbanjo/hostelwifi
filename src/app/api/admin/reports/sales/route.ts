import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoAdminData } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function GET(request: Request) {
  await requireAdmin();
  if (!hasDatabaseUrl) return NextResponse.json({ orders: demoAdminData.salesRows, demo: true });
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const where = {
    orderStatus: "completed" as const,
    ...(from || to ? { paidAt: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } } : {})
  };
  const orders = await prisma.order.findMany({ where, include: { hostel: true, plan: true }, orderBy: { paidAt: "desc" } });
  return NextResponse.json({ orders });
}
