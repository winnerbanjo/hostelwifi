import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await prisma.hostelPlan.findMany({
    where: { hostelId: id, status: "active", plan: { status: "active" } },
    include: { plan: true },
    orderBy: { plan: { price: "asc" } }
  });
  return NextResponse.json({ plans: rows.map((row) => row.plan) });
}
