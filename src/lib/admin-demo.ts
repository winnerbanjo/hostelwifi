import { demoHostels, demoPlans, demoPolicies, demoVoucherCode } from "@/lib/demo-data";

const now = new Date();
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

export const demoAdmin = {
  id: "demo-admin",
  name: "Jendor Admin",
  email: process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@jendortheplug.com",
  role: "SUPER_ADMIN",
  status: "active",
  createdAt: now,
  updatedAt: now
};

export const demoCustomer = {
  id: "demo-customer",
  fullName: "Demo Student",
  phone: "09038264264",
  email: "demo@example.com",
  createdAt: now,
  updatedAt: now,
  orders: []
};

export const demoVoucher = {
  id: "demo-voucher",
  code: demoVoucherCode("JTP-DEMO-ORDER"),
  status: "delivered",
  validityDays: 7,
  deviceLimit: 1,
  dataSizeGb: null,
  generatedAt: now,
  expiresAt,
  createdAt: now,
  updatedAt: now,
  customer: demoCustomer,
  hostel: demoHostels[0],
  plan: demoPlans[1]
};

export const demoOrder = {
  id: "demo-order",
  reference: "JTP-DEMO-ORDER",
  fullName: "Demo Student",
  phone: "09038264264",
  email: "demo@example.com",
  roomNumber: "A12",
  blockFloor: "Block A",
  amount: demoPlans[1].price,
  paymentMethod: "bank_transfer",
  paymentStatus: "bank_confirmed",
  orderStatus: "completed",
  paidAt: now,
  createdAt: now,
  updatedAt: now,
  hostel: demoHostels[0],
  plan: demoPlans[1],
  voucher: demoVoucher
};

export const demoPendingBankOrder = {
  ...demoOrder,
  id: "demo-bank-order",
  reference: "JTP-DEMO-BANK",
  amount: demoPlans[3].price,
  paymentMethod: "bank_transfer",
  paymentStatus: "awaiting_bank_confirmation",
  orderStatus: "pending",
  plan: demoPlans[3],
  voucher: null
};

export const demoSupportTicket = {
  id: "demo-ticket",
  fullName: "Demo Student",
  phone: "09038264264",
  email: "demo@example.com",
  issueType: "Voucher not working",
  message: "Room: A12\nI need help checking my voucher.",
  status: "open",
  createdAt: now,
  updatedAt: now,
  hostel: demoHostels[0],
  order: demoOrder,
  voucher: demoVoucher
};

export const demoPolicyRows = Object.entries(demoPolicies).map(([slug, policy]) => ({
  id: `policy-${slug}`,
  slug,
  title: policy.title,
  content: policy.content,
  updatedAt: now
}));

export const demoAdminData = {
  metrics: {
    totalRevenue: demoOrder.amount,
    todayRevenue: demoOrder.amount,
    totalOrders: 2,
    successfulPayments: 1,
    pendingBankTransfers: 1,
    failedPayments: 0,
    vouchersGenerated: 1,
    activeVouchers: 1,
    supportComplaints: 1,
    topSellingPlan: demoPlans[1].name,
    topHostelByRevenue: demoHostels[0].name
  },
  orders: [demoPendingBankOrder, demoOrder],
  vouchers: [demoVoucher],
  hostels: demoHostels,
  plans: demoPlans,
  tickets: [demoSupportTicket],
  policies: demoPolicyRows,
  customers: [{ ...demoCustomer, orders: [demoOrder] }],
  salesRows: [demoOrder],
  hostelRows: [{ hostelId: demoHostels[0].id, hostel: demoHostels[0], _sum: { amount: demoOrder.amount }, _count: 1 }],
  planRows: [{ planId: demoPlans[1].id, plan: demoPlans[1], _sum: { amount: demoOrder.amount }, _count: 1 }],
  voucherRows: [{ status: "delivered", _count: 1 }],
  failedPayments: []
};
