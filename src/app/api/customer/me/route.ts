import { NextResponse } from "next/server";
import { getCustomer } from "@/lib/auth";
import { db } from "@/lib/db";

function publicCustomer(customer: any) {
  const { passwordHash, ...safe } = customer;
  return safe;
}

export async function GET() {
  const customer = await getCustomer();
  if (!customer) return NextResponse.json({ customer: null });

  const fresh = await db.customer.findUnique({
    where: { id: customer.id },
    include: { orders: true, walletTransactions: true }
  });
  const orders = await db.order.findMany({
    where: { customerId: customer.id },
    include: { hostel: true, plan: true, voucher: true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    customer: publicCustomer(fresh || customer),
    orders,
    walletTransactions: fresh?.walletTransactions || []
  });
}
