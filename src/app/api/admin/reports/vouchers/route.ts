import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoAdminData } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function GET() {
  await requireAdmin();
  if (!hasDatabaseUrl) return NextResponse.json({ rows: demoAdminData.voucherRows, demo: true });
  const rows = await db.voucher.groupBy({ by: ["status"], _count: true });
  return NextResponse.json({ rows });
}
