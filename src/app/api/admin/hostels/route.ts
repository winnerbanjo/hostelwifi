import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoAdminData } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function GET() {
  await requireAdmin();
  if (!hasDatabaseUrl) return NextResponse.json({ hostels: demoAdminData.hostels, demo: true });
  return NextResponse.json({ hostels: await prisma.hostel.findMany({ orderBy: { name: "asc" } }) });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const data = await request.json();
  if (!hasDatabaseUrl) {
    return NextResponse.json({ hostel: { id: `demo-${Date.now()}`, ...data, status: data.status || "active" }, demo: true });
  }
  const hostel = await prisma.hostel.create({
    data: {
      name: data.name,
      address: data.address || "",
      wifiSsid: data.wifiSsid || "",
      supportPhone: data.supportPhone || "",
      status: data.status || "active"
    }
  });
  await prisma.auditLog.create({ data: { adminUserId: admin.id, action: "create", entityType: "Hostel", entityId: hostel.id } });
  return NextResponse.json({ hostel });
}
