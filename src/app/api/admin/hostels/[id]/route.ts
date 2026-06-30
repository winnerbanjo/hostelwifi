import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const data = await request.json();
  const hostel = await db.hostel.update({
    where: { id },
    data: {
      name: data.name,
      address: data.address,
      wifiSsid: data.wifiSsid,
      supportPhone: data.supportPhone,
      status: data.status
    }
  });
  await db.auditLog.create({ data: { adminUserId: admin.id, action: "update", entityType: "Hostel", entityId: id } });
  return NextResponse.json({ hostel });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const count = await db.order.count({ where: { hostelId: id } });
  if (count) return NextResponse.json({ error: "Disable this hostel instead. It already has orders." }, { status: 400 });
  await db.hostel.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
