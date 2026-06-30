import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoAdminData } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function GET() {
  await requireAdmin();
  if (!hasDatabaseUrl) return NextResponse.json({ rows: demoAdminData.hostelRows, demo: true });
  const rows = await db.order.groupBy({ by: ["hostelId"], where: { orderStatus: "completed" }, _sum: { amount: true }, _count: true });
  const hostels = await db.hostel.findMany();
  return NextResponse.json({ rows: rows.map((row: any) => ({ ...row, hostel: hostels.find((h: any) => h.id === row.hostelId) })) });
}
