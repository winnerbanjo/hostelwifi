import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await request.json();

    const customer = await db.customer.findUnique({ where: { id } });
    if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

    const updateData: any = {};
    if (data.fullName !== undefined) updateData.fullName = String(data.fullName).trim();
    if (data.phone !== undefined) updateData.phone = String(data.phone).trim();
    if (data.email !== undefined) updateData.email = String(data.email).trim();
    if (data.walletBalance !== undefined) updateData.walletBalance = Number(data.walletBalance);
    
    if (data.password !== undefined && String(data.password).trim() !== "") {
      updateData.passwordHash = await bcrypt.hash(String(data.password).trim(), 12);
    }

    if (data.hostelId !== undefined && data.hostelId !== customer.hostelId) {
      // Enforce the once in 30 days check unless bypass/force is specified
      const url = new URL(request.url);
      const force = url.searchParams.get("force") === "true";

      if (!force && customer.lastHostelChangedAt) {
        const lastChanged = new Date(customer.lastHostelChangedAt);
        const diffMs = Date.now() - lastChanged.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays < 30) {
          const remainingDays = Math.ceil(30 - diffDays);
          return NextResponse.json({
            error: `This customer's hostel was updated recently. You can only change it once every 30 days. Wait ${remainingDays} more day(s), or force save.`
          }, { status: 400 });
        }
      }
      updateData.hostelId = data.hostelId;
      updateData.lastHostelChangedAt = new Date();
    }

    const updated = await db.customer.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ customer: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An error occurred." }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check if customer exists
    const customer = await db.customer.findUnique({ where: { id } });
    if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

    // Delete customer
    await db.customer.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An error occurred." }, { status: 400 });
  }
}
