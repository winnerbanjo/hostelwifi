import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoAdminData } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function GET() {
  await requireAdmin();
  if (!hasDatabaseUrl) return NextResponse.json({ metrics: demoAdminData.metrics, demo: true });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [paid, todayPaid, totalOrders, pendingBank, failed, vouchers, activeVouchers, complaints, plans, hostels] = await Promise.all([
    prisma.order.aggregate({ where: { orderStatus: "completed" }, _sum: { amount: true }, _count: true }),
    prisma.order.aggregate({ where: { orderStatus: "completed", paidAt: { gte: today } }, _sum: { amount: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { paymentStatus: "awaiting_bank_confirmation" } }),
    prisma.order.count({ where: { paymentStatus: "failed" } }),
    prisma.voucher.count(),
    prisma.voucher.count({ where: { status: { in: ["generated", "delivered", "active"] } } }),
    prisma.supportTicket.count({ where: { status: { in: ["open", "in_progress"] } } }),
    prisma.order.groupBy({ by: ["planId"], where: { orderStatus: "completed" }, _sum: { amount: true }, _count: true, orderBy: { _count: { planId: "desc" } }, take: 1 }),
    prisma.order.groupBy({ by: ["hostelId"], where: { orderStatus: "completed" }, _sum: { amount: true }, orderBy: { _sum: { amount: "desc" } }, take: 1 })
  ]);
  const topPlan = plans[0] ? await prisma.plan.findUnique({ where: { id: plans[0].planId } }) : null;
  const topHostel = hostels[0] ? await prisma.hostel.findUnique({ where: { id: hostels[0].hostelId } }) : null;
  return NextResponse.json({
    metrics: {
      totalRevenue: paid._sum.amount || 0,
      todayRevenue: todayPaid._sum.amount || 0,
      totalOrders,
      successfulPayments: paid._count,
      pendingBankTransfers: pendingBank,
      failedPayments: failed,
      vouchersGenerated: vouchers,
      activeVouchers,
      supportComplaints: complaints,
      topSellingPlan: topPlan?.name || "None yet",
      topHostelByRevenue: topHostel?.name || "None yet"
    }
  });
}
