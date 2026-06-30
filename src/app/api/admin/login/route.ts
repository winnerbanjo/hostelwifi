import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { demoAdmin } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";
import { setAdminSession } from "@/lib/auth";
import { adminLoginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const parsed = adminLoginSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid login details" }, { status: 400 });
  if (!hasDatabaseUrl) {
    const email = process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@jendortheplug.com";
    const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || "admin12345";
    if (parsed.data.email !== email || parsed.data.password !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    await setAdminSession(demoAdmin.id);
    return NextResponse.json({ admin: demoAdmin, demo: true });
  }
  const admin = await db.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (!admin || admin.status !== "active") return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const ok = await bcrypt.compare(parsed.data.password, admin.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  await setAdminSession(admin.id);
  return NextResponse.json({ admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
}
