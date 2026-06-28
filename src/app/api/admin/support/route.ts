import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoAdminData } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function GET() {
  await requireAdmin();
  if (!hasDatabaseUrl) return NextResponse.json({ tickets: demoAdminData.tickets, demo: true });
  const tickets = await prisma.supportTicket.findMany({ include: { hostel: true, order: true, voucher: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ tickets });
}
