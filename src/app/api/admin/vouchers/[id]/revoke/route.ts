import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { networkProvider } from "@/lib/network-provider";
import { demoVoucher } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!hasDatabaseUrl) return NextResponse.json({ voucher: { ...demoVoucher, status: "revoked", revokedAt: new Date() }, demo: true });
  const current = await prisma.voucher.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
  const voucher = await networkProvider.revokeVoucher(current.code);
  await prisma.auditLog.create({ data: { adminUserId: admin.id, action: "revoke_voucher", entityType: "Voucher", entityId: id } });
  return NextResponse.json({ voucher });
}
