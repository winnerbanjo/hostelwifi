import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { completePaidOrder, createOrderReference } from "@/lib/orders";
import { walletOrderSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const customer = await requireCustomer();
  const parsed = walletOrderSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const plan = await db.plan.findUnique({ where: { id: data.planId } });
  const hostelPlan = await db.hostelPlan.findFirst({
    where: { hostelId: data.hostelId, planId: data.planId, status: "active", hostel: { status: "active" }, plan: { status: "active" } }
  });
  if (!plan || !hostelPlan) return NextResponse.json({ error: "Plan is not available for this hostel." }, { status: 400 });

  const balance = Number(customer.walletBalance || 0);
  const amount = Number(plan.price || 0);
  if (balance < amount) return NextResponse.json({ error: "Wallet balance is not enough for this plan." }, { status: 400 });

  const reference = createOrderReference();
  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        reference,
        customerId: customer.id,
        hostelId: data.hostelId,
        planId: data.planId,
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        roomNumber: data.roomNumber,
        blockFloor: data.blockFloor,
        amount,
        paymentMethod: "wallet",
        paymentStatus: "paid",
        orderStatus: "pending",
        paidAt: new Date()
      }
    });
    await tx.customer.update({ where: { id: customer.id }, data: { walletBalance: balance - amount } });
    await tx.walletTransaction.create({
      data: {
        customerId: customer.id,
        orderId: created.id,
        type: "purchase",
        amount: -amount,
        status: "completed",
        note: `Wallet payment for ${plan.name}`
      }
    });
    return created;
  });

  const completed = await completePaidOrder(reference, "wallet", { orderId: order.id, walletBalanceBefore: balance });
  return NextResponse.json({ order: completed });
}
