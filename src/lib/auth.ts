import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { demoAdmin } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

const cookieName = "jtp_admin_session";

function secret() {
  return process.env.ADMIN_SESSION_SECRET || "dev-only-change-me";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export async function setAdminSession(adminId: string) {
  const payload = JSON.stringify({ adminId, exp: Date.now() + 1000 * 60 * 60 * 24 });
  const value = Buffer.from(payload).toString("base64url");
  const signature = sign(value);
  const jar = await cookies();
  jar.set(cookieName, `${value}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(cookieName);
}

export async function getAdmin() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) return null;
  const [value, signature] = token.split(".");
  if (!value || !signature) return null;
  const expected = sign(value);
  const ok =
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!ok) return null;
  const payload = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as { adminId: string; exp: number };
  if (payload.exp < Date.now()) return null;
  if (!hasDatabaseUrl && payload.adminId === demoAdmin.id) return demoAdmin;
  return db.adminUser.findFirst({ where: { id: payload.adminId, status: "active" } });
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) throw new Error("Unauthorized");
  return admin;
}
