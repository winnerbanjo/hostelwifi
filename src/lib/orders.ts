import { prisma } from "@/lib/db";
import { deliverVoucher } from "@/lib/delivery";
import { networkProvider } from "@/lib/network-provider";

export async function completePaidOrder(reference: string, provider: string, rawResponse: unknown) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { reference },
      include: { plan: true, hostel: true, voucher: true }
    });
    if (!order) throw new Error("Order not found");
    if (order.voucher) return order;

    const voucher = await networkProvider.generateVoucher(
      {
        orderId: order.id,
        customerId: order.customerId,
        hostelId: order.hostelId,
        planId: order.planId,
        validityDays: order.plan.validityDays,
        deviceLimit: order.plan.deviceLimit,
        dataSizeGb: order.plan.dataSizeGb
      },
      tx
    );

    await tx.order.update({
      where: { id: order.id },
      data: {
        voucherId: voucher.id,
        paymentStatus: order.paymentMethod === "bank_transfer" ? "bank_confirmed" : "paid",
        orderStatus: "completed",
        paidAt: new Date()
      }
    });

    await tx.paymentLog.create({
      data: {
        orderId: order.id,
        provider,
        reference,
        amount: order.amount,
        status: "success",
        rawResponse: rawResponse as object
      }
    });

    return { ...order, voucher };
  }).then(async (order) => {
    const fresh = await prisma.order.findUnique({
      where: { id: order.id },
      include: { voucher: true, plan: true, hostel: true }
    });
    if (fresh?.voucher) {
      const delivery = await deliverVoucher({ order: fresh, voucher: fresh.voucher, plan: fresh.plan, hostel: fresh.hostel });
      await prisma.voucher.update({
        where: { id: fresh.voucher.id },
        data: { status: "delivered", deliveryStatus: JSON.stringify(delivery) }
      });
    }
    return fresh;
  });
}

export function createOrderReference() {
  return `JTP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
