import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const data = await request.json();
    const currentPassword = String(data.currentPassword || "").trim();
    const newPassword = String(data.newPassword || "").trim();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters long." }, { status: 400 });
    }

    if (!hasDatabaseUrl) {
      return NextResponse.json({
        demo: true,
        message: "Connect MONGODB_URI to change password permanently."
      });
    }

    const fullAdmin = await db.adminUser.findUnique({ where: { id: admin.id } });
    if (!fullAdmin || !fullAdmin.passwordHash) {
      return NextResponse.json({ error: "Admin account not found." }, { status: 404 });
    }

    const ok = await bcrypt.compare(currentPassword, fullAdmin.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect current password." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash }
    });

    await db.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "change_admin_password",
        entityType: "AdminUser",
        entityId: admin.id,
        metadata: {}
      }
    });

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error." }, { status: 500 });
  }
}
