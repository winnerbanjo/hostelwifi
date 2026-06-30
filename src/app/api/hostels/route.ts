import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const hostels = await db.hostel.findMany({ where: { status: "active" }, orderBy: { name: "asc" } });
  return NextResponse.json({ hostels });
}
