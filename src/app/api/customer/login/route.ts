import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { setCustomerSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerLoginSchema } from "@/lib/validators";

function publicCustomer(customer: any) {
  const { passwordHash, ...safe } = customer;
  return safe;
}

export async function POST(request: Request) {
  const parsed = customerLoginSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const customer = await db.customer.findFirst({ where: { email: parsed.data.email } });
  if (!customer?.passwordHash) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  const ok = await bcrypt.compare(parsed.data.password, customer.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  await setCustomerSession(customer.id);
  return NextResponse.json({ customer: publicCustomer(customer) });
}
