import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { demoAdminData } from "@/lib/admin-demo";
import { hasDatabaseUrl } from "@/lib/demo-data";

export async function GET() {
  await requireAdmin();
  if (!hasDatabaseUrl) return NextResponse.json({ metrics: demoAdminData.metrics, demo: true });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [paid, todayPaid, totalOrders, pendingBank, failed, vouchers, activeVouchers, complaints, plans, hostels] = await Promise.all([
    db.order.aggregate({ where: { orderStatus: "completed" }, _sum: { amount: true }, _count: true }),
    db.order.aggregate({ where: { orderStatus: "completed", paidAt: { gte: today } }, _sum: { amount: true } }),
    db.order.count(),
    db.order.count({ where: { paymentStatus: "awaiting_bank_confirmation" } }),
    db.order.count({ where: { paymentStatus: "failed" } }),
    db.voucher.count(),
    db.voucher.count({ where: { status: { in: ["generated", "delivered", "active"] } } }),
    db.supportTicket.count({ where: { status: { in: ["open", "in_progress"] } } }),
    db.order.groupBy({ by: ["planId"], where: { orderStatus: "completed" }, _sum: { amount: true }, _count: true, orderBy: { _count: { planId: "desc" } }, take: 1 }),
    db.order.groupBy({ by: ["hostelId"], where: { orderStatus: "completed" }, _sum: { amount: true }, orderBy: { _sum: { amount: "desc" } }, take: 1 })
  ]);
  const topPlan = plans[0] ? await db.plan.findUnique({ where: { id: plans[0].planId } }) : null;
  const topHostel = hostels[0] ? await db.hostel.findUnique({ where: { id: hostels[0].hostelId } }) : null;
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
