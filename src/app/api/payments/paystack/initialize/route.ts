import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/demo-data";
import { initializePaystack } from "@/lib/paystack";

export async function POST(request: Request) {
  const { reference, planId, hostelId } = await request.json();
  if (!hasDatabaseUrl) {
    return NextResponse.json({
      data: {
        authorization_url: `/payment/success?reference=${reference}&demo=1&planId=${planId || ""}&hostelId=${hostelId || ""}`,
        access_code: "demo",
        reference
      },
      demo: true
    });
  }

  const order = await prisma.order.findUnique({ where: { reference } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.paymentMethod !== "paystack") return NextResponse.json({ error: "Order is not a Paystack order" }, { status: 400 });

  const appUrl = process.env.APP_URL || new URL(request.url).origin;
  const data = await initializePaystack({
    email: order.email,
    amount: order.amount,
    reference: order.reference,
    callbackUrl: `${appUrl}/payment/success?reference=${order.reference}`
  });
  await prisma.order.update({ where: { id: order.id }, data: { paystackReference: order.reference } });
  return NextResponse.json({ data });
}
