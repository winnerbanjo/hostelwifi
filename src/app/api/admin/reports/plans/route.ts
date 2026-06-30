import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoAdminData } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function GET() {
  await requireAdmin();
  if (!hasDatabaseUrl) return NextResponse.json({ rows: demoAdminData.planRows, demo: true });
  const rows = await db.order.groupBy({ by: ["planId"], where: { orderStatus: "completed" }, _sum: { amount: true }, _count: true });
  const plans = await db.plan.findMany();
  return NextResponse.json({ rows: rows.map((row: any) => ({ ...row, plan: plans.find((p: any) => p.id === row.planId) })) });
}
