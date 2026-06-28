import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const data = await request.json();
  const plan = await prisma.plan.update({
    where: { id },
    data: {
      name: data.name,
      price: data.price === undefined ? undefined : Number(data.price),
      dataType: data.dataType,
      dataSizeGb: data.dataSizeGb === "" ? null : data.dataSizeGb === undefined ? undefined : Number(data.dataSizeGb),
      validityDays: data.validityDays === undefined ? undefined : Number(data.validityDays),
      deviceLimit: data.deviceLimit === undefined ? undefined : Number(data.deviceLimit),
      includesTv: data.includesTv === undefined ? undefined : Boolean(data.includesTv),
      description: data.description,
      badge: data.badge,
      status: data.status
    }
  });
  await prisma.auditLog.create({ data: { adminUserId: admin.id, action: "update", entityType: "Plan", entityId: id } });
  return NextResponse.json({ plan });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const count = await prisma.order.count({ where: { planId: id } });
  if (count) return NextResponse.json({ error: "Disable this plan instead. It already has orders." }, { status: 400 });
  await prisma.plan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
