export const demoHostels = [
  { id: "answereth-villa", name: "Answereth Villa", address: "Iworoko Ekiti, Ekiti State", wifiSsid: "", supportPhone: "09038264264", status: "active", createdAt: new Date(), updatedAt: new Date() },
  { id: "comrade-villa", name: "Comrade Villa", address: "Iworoko Ekiti, Ekiti State", wifiSsid: "", supportPhone: "09038264264", status: "active", createdAt: new Date(), updatedAt: new Date() },
  { id: "basorun-hostel", name: "Basorun Hostel", address: "Iworoko Ekiti, Ekiti State", wifiSsid: "", supportPhone: "09038264264", status: "active", createdAt: new Date(), updatedAt: new Date() },
  { id: "peace-coco-hostel", name: "Peace Coco Hostel", address: "Iworoko Ekiti, Ekiti State", wifiSsid: "", supportPhone: "09038264264", status: "active", createdAt: new Date(), updatedAt: new Date() }
];

export const demoPlans = [
  { id: "1-day-unlimited", name: "1 Day Unlimited", price: 500, dataType: "unlimited", dataSizeGb: null, validityDays: 1, deviceLimit: 1, includesTv: false, description: "Quick daily access", badge: "Popular", status: "active", createdAt: new Date(), updatedAt: new Date() },
  { id: "7-days-unlimited", name: "7 Days Unlimited", price: 3000, dataType: "unlimited", dataSizeGb: null, validityDays: 7, deviceLimit: 1, includesTv: false, description: "A full week of steady browsing", badge: "Best Value", status: "active", createdAt: new Date(), updatedAt: new Date() },
  { id: "30-days-20gb", name: "30 Days 20GB", price: 3000, dataType: "limited", dataSizeGb: 20, validityDays: 30, deviceLimit: 1, includesTv: false, description: "Affordable monthly data bundle", badge: null, status: "active", createdAt: new Date(), updatedAt: new Date() },
  { id: "unlimited-tv", name: "Unlimited TV", price: 8000, dataType: "unlimited", dataSizeGb: null, validityDays: 30, deviceLimit: 1, includesTv: true, description: "Dedicated TV streaming access", badge: "For TV", status: "active", createdAt: new Date(), updatedAt: new Date() },
  { id: "unlimited-1-month-1-device", name: "Unlimited 1 Month", price: 11500, dataType: "unlimited", dataSizeGb: null, validityDays: 30, deviceLimit: 1, includesTv: false, description: "Unlimited monthly access for one device", badge: "Popular", status: "active", createdAt: new Date(), updatedAt: new Date() },
  { id: "unlimited-1-month-2-devices", name: "Unlimited 1 Month", price: 22000, dataType: "unlimited", dataSizeGb: null, validityDays: 30, deviceLimit: 2, includesTv: false, description: "Unlimited monthly access for two devices", badge: null, status: "active", createdAt: new Date(), updatedAt: new Date() },
  { id: "unlimited-1-month-3-devices", name: "Unlimited 1 Month", price: 30000, dataType: "unlimited", dataSizeGb: null, validityDays: 30, deviceLimit: 3, includesTv: false, description: "Unlimited monthly access for three devices", badge: null, status: "active", createdAt: new Date(), updatedAt: new Date() },
  { id: "super-plan", name: "Super Plan", price: 35000, dataType: "unlimited", dataSizeGb: null, validityDays: 30, deviceLimit: 3, includesTv: true, description: "Three devices plus TV access", badge: "Super Plan", status: "active", createdAt: new Date(), updatedAt: new Date() }
];

export const demoPolicies = {
  terms: {
    title: "Terms and Conditions",
    content: "By purchasing a Jendor The Plug voucher, you agree to use the internet service responsibly, provide accurate checkout details, and follow hostel network rules. Voucher access is tied to the selected plan, hostel, validity period, and device limit."
  },
  privacy: {
    title: "Privacy Policy",
    content: "We collect customer name, phone number, email, hostel, room details, payment records, support messages, and voucher records so we can process purchases, deliver vouchers, provide support, prevent fraud, and maintain service records."
  },
  refund: {
    title: "Refund Policy",
    content: "Payments are non-refundable once a voucher has been generated and used. If payment is successful but voucher is not delivered, support will verify and resend or issue a replacement. Refunds may be considered only for duplicate payments or confirmed failed service before usage."
  },
  "fair-usage": {
    title: "Fair Usage Policy",
    content: "Unlimited plans are provided for normal student browsing, study, streaming, calls, and personal use. Activities that damage network quality for others, abuse bandwidth, or attempt to bypass device limits may lead to suspension."
  },
  "internet-usage-rules": {
    title: "Internet Usage Rules",
    content: "Do not share, resell, hack, scan, spam, or use the service for illegal activity. Connect only the allowed number of devices. Contact support on WhatsApp if your voucher is not working."
  }
};

export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

export function demoVoucherCode(reference: string) {
  const clean = reference.replace(/[^A-Z0-9]/gi, "").toUpperCase().padEnd(8, "X");
  return `JTP-${clean.slice(-8, -4)}-${clean.slice(-4)}`;
}

export function demoOrder(reference: string, paymentMethod: "paystack" | "bank_transfer" = "paystack", planId?: string, hostelId?: string) {
  const plan = demoPlans.find((item) => item.id === planId) || demoPlans[0];
  const hostel = demoHostels.find((item) => item.id === hostelId) || demoHostels[0];
  return {
    id: reference,
    reference,
    fullName: "Demo Student",
    phone: "09038264264",
    email: "student@example.com",
    roomNumber: "A12",
    blockFloor: "Block A",
    amount: plan.price,
    paymentMethod,
    paymentStatus: paymentMethod === "bank_transfer" ? "awaiting_bank_confirmation" : "paid",
    orderStatus: paymentMethod === "bank_transfer" ? "pending" : "completed",
    hostel,
    plan,
    voucher: paymentMethod === "bank_transfer" ? null : {
      id: `voucher-${reference}`,
      code: demoVoucherCode(reference),
      status: "delivered",
      validityDays: plan.validityDays,
      deviceLimit: plan.deviceLimit,
      dataSizeGb: plan.dataSizeGb,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + plan.validityDays * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  };
}
