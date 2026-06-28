import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { completePaidOrder } from "@/lib/orders";
import { verifyPaystack } from "@/lib/paystack";

export async function GET(_: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const order = await prisma.order.findUnique({ where: { reference }, include: { voucher: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.voucherId) return NextResponse.json({ order });

  const verification = await verifyPaystack(reference);
  const paid = verification.status && verification.data?.status === "success";
  if (!paid) {
    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "failed", orderStatus: "failed" } });
    await prisma.paymentLog.create({
      data: { orderId: order.id, provider: "paystack", reference, amount: order.amount, status: "failed", rawResponse: verification }
    });
    return NextResponse.json({ error: "Payment was not successful", verification }, { status: 400 });
  }

  const completed = await completePaidOrder(reference, "paystack", verification);
  return NextResponse.json({ order: completed });
}
