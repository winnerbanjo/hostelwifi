import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { setCustomerSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerSignupSchema } from "@/lib/validators";

function publicCustomer(customer: any) {
  const { passwordHash, ...safe } = customer;
  return safe;
}

export async function POST(request: Request) {
  const parsed = customerSignupSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const existing = await db.customer.findFirst({ where: { email: data.email } });
  if (existing?.passwordHash) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const customer = existing
    ? await db.customer.update({
        where: { id: existing.id },
        data: { fullName: data.fullName, phone: data.phone, passwordHash, hostelId: data.hostelId, status: "active" }
      })
    : await db.customer.create({
        data: {
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          passwordHash,
          hostelId: data.hostelId,
          walletBalance: 0,
          status: "active",
          lastHostelChangedAt: new Date()
        }
      });

  await setCustomerSession(customer.id);
  return NextResponse.json({ customer: publicCustomer(customer) });
}
