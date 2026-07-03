import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoAdminData } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

function clean(value: unknown) {
  return String(value || "").trim();
}

function positiveInt(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

export async function GET() {
  await requireAdmin();
  if (!hasDatabaseUrl) return NextResponse.json({ plans: demoAdminData.plans, demo: true });
  return NextResponse.json({ plans: await db.plan.findMany({ orderBy: { price: "asc" } }) });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const data = await request.json();
  const name = clean(data.name);
  const price = positiveInt(data.price);
  const validityDays = positiveInt(data.validityDays);
  const deviceLimit = positiveInt(data.deviceLimit);
  const dataSizeGb = data.dataSizeGb ? positiveInt(data.dataSizeGb) : null;
  const dataType = data.dataType === "limited" ? "limited" : "unlimited";

  if (!name) return NextResponse.json({ error: "Plan name is required." }, { status: 400 });
  if (!price) return NextResponse.json({ error: "Plan price must be greater than 0." }, { status: 400 });
  if (!validityDays) return NextResponse.json({ error: "Validity days must be greater than 0." }, { status: 400 });
  if (!deviceLimit) return NextResponse.json({ error: "Device limit must be greater than 0." }, { status: 400 });
  if (data.dataSizeGb && !dataSizeGb) return NextResponse.json({ error: "Data size must be greater than 0." }, { status: 400 });

  if (!hasDatabaseUrl) {
    return NextResponse.json({ plan: { id: `demo-${Date.now()}`, ...data, name, price, validityDays, deviceLimit, dataSizeGb, dataType, status: data.status || "active" }, demo: true });
  }
  const plan = await db.plan.create({
    data: {
      name,
      price,
      dataType,
      dataSizeGb,
      validityDays,
      deviceLimit,
      includesTv: Boolean(data.includesTv),
      description: clean(data.description),
      badge: clean(data.badge),
      status: data.status || "active"
    }
  });
  if (data.hostelIds && Array.isArray(data.hostelIds) && data.hostelIds.length) {
    await db.hostelPlan.createMany({
        data: data.hostelIds.map((hostelId: string) => ({ hostelId, planId: plan.id })),
        skipDuplicates: true
      });
    
  }
  await db.auditLog.create({ data: { adminUserId: admin.id, action: "create", entityType: "Plan", entityId: plan.id } });
  return NextResponse.json({ plan });
}
