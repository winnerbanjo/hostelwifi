import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const hostels = await prisma.hostel.findMany({ where: { status: "active" }, orderBy: { name: "asc" } });
  return NextResponse.json({ hostels });
}
