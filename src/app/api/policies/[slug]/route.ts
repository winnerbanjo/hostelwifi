import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = await db.policyPage.findUnique({ where: { slug } });
  if (!policy) return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  return NextResponse.json({ policy });
}
