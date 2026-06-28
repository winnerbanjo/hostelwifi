import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoAdminData } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function GET() {
  await requireAdmin();
  if (!hasDatabaseUrl) return NextResponse.json({ plans: demoAdminData.plans, demo: true });
  return NextResponse.json({ plans: await prisma.plan.findMany({ orderBy: { price: "asc" } }) });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const data = await request.json();
  if (!hasDatabaseUrl) {
    return NextResponse.json({ plan: { id: `demo-${Date.now()}`, ...data, status: data.status || "active" }, demo: true });
  }
  const plan = await prisma.plan.create({
    data: {
      name: data.name,
      price: Number(data.price),
      dataType: data.dataType || "unlimited",
      dataSizeGb: data.dataSizeGb ? Number(data.dataSizeGb) : null,
      validityDays: Number(data.validityDays),
      deviceLimit: Number(data.deviceLimit),
      includesTv: Boolean(data.includesTv),
      description: data.description || "",
      badge: data.badge || "",
      status: data.status || "active"
    }
  });
  if (data.assignAllHostels) {
    const hostels = await prisma.hostel.findMany();
    await prisma.hostelPlan.createMany({ data: hostels.map((hostel) => ({ hostelId: hostel.id, planId: plan.id })), skipDuplicates: true });
  }
  await prisma.auditLog.create({ data: { adminUserId: admin.id, action: "create", entityType: "Plan", entityId: plan.id } });
  return NextResponse.json({ plan });
}
