import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  await requireAdmin();
  const topups = await db.walletTransaction.findMany({
    where: { type: "topup" },
    include: { customer: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ topups });
}
