import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const admin = await requireAdmin();
  const { slug } = await params;
  const data = await request.json();
  if (!hasDatabaseUrl) return NextResponse.json({ policy: { id: `policy-${slug}`, slug, title: data.title, content: data.content, updatedAt: new Date() }, demo: true });
  const policy = await prisma.policyPage.update({ where: { slug }, data: { title: data.title, content: data.content } });
  await prisma.auditLog.create({ data: { adminUserId: admin.id, action: "update_policy", entityType: "PolicyPage", entityId: slug } });
  return NextResponse.json({ policy });
}
