import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoAdminData } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function GET() {
  await requireAdmin();
  if (!hasDatabaseUrl) return NextResponse.json({ vouchers: demoAdminData.vouchers, demo: true });
  const vouchers = await db.voucher.findMany({
    include: { hostel: true, plan: true, customer: true, order: true },
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return NextResponse.json({ vouchers });
}
