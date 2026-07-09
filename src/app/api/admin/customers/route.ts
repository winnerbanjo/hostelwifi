import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoAdminData } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";
import bcrypt from "bcryptjs";

export async function GET() {
  await requireAdmin();
  if (!hasDatabaseUrl) return NextResponse.json({ customers: demoAdminData.customers, demo: true });
  const customers = await db.customer.findMany({ include: { orders: true, walletTransactions: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ customers });
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const data = await request.json();

    const email = String(data.email || "").trim();
    const phone = String(data.phone || "").trim();
    const fullName = String(data.fullName || "").trim();
    const password = String(data.password || "").trim();
    const hostelId = String(data.hostelId || "").trim();
    const walletBalance = Number(data.walletBalance || 0);

    if (!email || !phone || !fullName || !password || !hostelId) {
      return NextResponse.json({ error: "Email, phone, full name, password, and hostel are required." }, { status: 400 });
    }

    // Check if email already exists
    const existing = await db.customer.findFirst({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "A customer with this email already exists." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const customer = await db.customer.create({
      data: {
        fullName,
        phone,
        email,
        passwordHash,
        hostelId,
        walletBalance,
        status: "active",
        lastHostelChangedAt: new Date()
      }
    });

    await db.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "create_customer",
        entityType: "Customer",
        entityId: customer.id,
        metadata: { email, hostelId, walletBalance }
      }
    });

    return NextResponse.json({ customer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An error occurred." }, { status: 400 });
  }
}
