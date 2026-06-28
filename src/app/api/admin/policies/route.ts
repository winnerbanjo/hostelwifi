import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoAdminData } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function GET() {
  await requireAdmin();
  if (!hasDatabaseUrl) return NextResponse.json({ policies: demoAdminData.policies, demo: true });
  return NextResponse.json({ policies: await prisma.policyPage.findMany({ orderBy: { title: "asc" } }) });
}
