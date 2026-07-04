import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const email = String(data.email || "").trim().toLowerCase();
    const phone = String(data.phone || "").trim();
    const newPassword = String(data.newPassword || "").trim();

    if (!email || !phone || !newPassword) {
      return NextResponse.json({ error: "Email, phone number, and new password are required." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters long." }, { status: 400 });
    }

    const customer = await db.customer.findFirst({ where: { email, phone } });
    if (!customer) {
      return NextResponse.json({ error: "No account found with this email and phone number combination." }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.customer.update({
      where: { id: customer.id },
      data: { passwordHash }
    });

    return NextResponse.json({ message: "Password reset successfully. You can now login with your new password." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error." }, { status: 500 });
  }
}
