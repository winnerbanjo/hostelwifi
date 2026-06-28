import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoAdminData } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function GET() {
  await requireAdmin();
  if (!hasDatabaseUrl) return NextResponse.json({ customers: demoAdminData.customers, demo: true });
  const customers = await prisma.customer.findMany({ include: { orders: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ customers });
}
