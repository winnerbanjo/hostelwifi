import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { demoPlans, hasDatabaseUrl } from "@/lib/demo-data";
import { createOrderReference } from "@/lib/orders";
import { orderSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const parsed = orderSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;

  if (!hasDatabaseUrl) {
    const plan = demoPlans.find((item) => item.id === data.planId) || demoPlans[0];
    const reference = createOrderReference();
    return NextResponse.json({
      order: {
        id: reference,
        reference,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        roomNumber: data.roomNumber,
        blockFloor: data.blockFloor,
        amount: plan.price,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentMethod === "bank_transfer" ? "awaiting_bank_confirmation" : "pending"
      },
      demo: true
    });
  }

  const plan = await prisma.plan.findUnique({ where: { id: data.planId } });
  const hostelPlan = await prisma.hostelPlan.findFirst({
    where: { hostelId: data.hostelId, planId: data.planId, status: "active", hostel: { status: "active" }, plan: { status: "active" } }
  });
  if (!plan || !hostelPlan) return NextResponse.json({ error: "Plan is not available for this hostel" }, { status: 400 });

  const customer = await prisma.customer.upsert({
    where: { email_phone: { email: data.email, phone: data.phone } },
    update: { fullName: data.fullName },
    create: { fullName: data.fullName, phone: data.phone, email: data.email }
  });

  const reference = createOrderReference();
  const order = await prisma.order.create({
    data: {
      reference,
      customerId: customer.id,
      hostelId: data.hostelId,
      planId: data.planId,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      roomNumber: data.roomNumber,
      blockFloor: data.blockFloor,
      amount: plan.price,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentMethod === "bank_transfer" ? "awaiting_bank_confirmation" : "pending"
    }
  });

  return NextResponse.json({ order });
}
