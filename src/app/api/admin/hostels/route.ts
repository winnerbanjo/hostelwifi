import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoAdminData } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

function clean(value: unknown) {
  return String(value || "").trim();
}

export async function GET() {
  await requireAdmin();
  if (!hasDatabaseUrl) return NextResponse.json({ hostels: demoAdminData.hostels, demo: true });
  return NextResponse.json({ hostels: await db.hostel.findMany({ orderBy: { name: "asc" } }) });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const data = await request.json();
  const name = clean(data.name);
  if (!name) return NextResponse.json({ error: "Hostel name is required." }, { status: 400 });
  if (!hasDatabaseUrl) {
    return NextResponse.json({ hostel: { id: `demo-${Date.now()}`, ...data, name, status: data.status || "active" }, demo: true });
  }
  const hostel = await db.hostel.create({
    data: {
      name,
      address: clean(data.address),
      wifiSsid: clean(data.wifiSsid),
      supportPhone: clean(data.supportPhone),
      status: data.status || "active"
    }
  });
  const plans = await db.plan.findMany({ where: { status: "active" }, select: { id: true } });
  if (plans.length) {
    await db.hostelPlan.createMany({
      data: plans.map((plan: any) => ({ hostelId: hostel.id, planId: plan.id })),
      skipDuplicates: true
    });
  }
  await db.auditLog.create({ data: { adminUserId: admin.id, action: "create", entityType: "Hostel", entityId: hostel.id } });
  return NextResponse.json({ hostel });
}
