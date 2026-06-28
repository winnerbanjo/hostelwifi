import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoSupportTicket } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const data = await request.json();
  if (!hasDatabaseUrl) return NextResponse.json({ ticket: { ...demoSupportTicket, status: data.status || "open", adminNote: data.adminNote || "" }, demo: true });
  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: { status: data.status, adminNote: data.adminNote }
  });
  await prisma.auditLog.create({ data: { adminUserId: admin.id, action: "update_support_ticket", entityType: "SupportTicket", entityId: id } });
  return NextResponse.json({ ticket });
}
