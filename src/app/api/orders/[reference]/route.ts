import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const order = await db.order.findUnique({
    where: { reference },
    include: { hostel: true, plan: true, voucher: true }
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order });
}
