import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const hostels = ["Answereth Villa", "Comrade Villa", "Basorun Hostel", "Peace Coco Hostel"];

const plans = [
  ["1 Day Unlimited", 500, "unlimited", null, 1, 1, false, "Quick daily access", "Popular"],
  ["7 Days Unlimited", 3000, "unlimited", null, 7, 1, false, "A full week of steady browsing", "Best Value"],
  ["30 Days 20GB", 3000, "limited", 20, 30, 1, false, "Affordable monthly data bundle", ""],
  ["Unlimited TV", 8000, "unlimited", null, 30, 1, true, "Dedicated TV streaming access", "For TV"],
  ["Unlimited 1 Month", 11500, "unlimited", null, 30, 1, false, "Unlimited monthly access for one device", "Popular"],
  ["Unlimited 1 Month", 22000, "unlimited", null, 30, 2, false, "Unlimited monthly access for two devices", ""],
  ["Unlimited 1 Month", 30000, "unlimited", null, 30, 3, false, "Unlimited monthly access for three devices", ""],
  ["Super Plan", 35000, "unlimited", null, 30, 3, true, "Three devices plus TV access", "Super Plan"]
] as const;

const policies = [
  ["Terms and Conditions", "terms", "By purchasing a Jendor The Plug voucher, you agree to use the internet service responsibly, provide accurate checkout details, and follow hostel network rules. Voucher access is tied to the selected plan, hostel, validity period, and device limit."],
  ["Privacy Policy", "privacy", "We collect customer name, phone number, email, hostel, room details, payment records, support messages, and voucher records so we can process purchases, deliver vouchers, provide support, prevent fraud, and maintain service records."],
  ["Refund Policy", "refund", "Payments are non-refundable once a voucher has been generated and used. If payment is successful but voucher is not delivered, support will verify and resend or issue a replacement. Refunds may be considered only for duplicate payments or confirmed failed service before usage."],
  ["Fair Usage Policy", "fair-usage", "Unlimited plans are provided for normal student browsing, study, streaming, calls, and personal use. Activities that damage network quality for others, abuse bandwidth, or attempt to bypass device limits may lead to suspension."],
  ["Internet Usage Rules", "internet-usage-rules", "Do not share, resell, hack, scan, spam, or use the service for illegal activity. Connect only the allowed number of devices. Contact support on WhatsApp if your voucher is not working."]
];

async function main() {
  const passwordHash = await bcrypt.hash(process.env.ADMIN_BOOTSTRAP_PASSWORD || "admin12345", 12);
  await prisma.adminUser.upsert({
    where: { email: process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@jendortheplug.com" },
    update: {},
    create: {
      name: "Jendor Admin",
      email: process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@jendortheplug.com",
      passwordHash,
      role: "SUPER_ADMIN"
    }
  });

  for (const name of hostels) {
    await prisma.hostel.upsert({
      where: { name },
      update: {},
      create: { name, address: "Iworoko Ekiti, Ekiti State", supportPhone: "09038264264" }
    });
  }

  const createdPlans = [];
  for (const [name, price, dataType, dataSizeGb, validityDays, deviceLimit, includesTv, description, badge] of plans) {
    const plan = await prisma.plan.create({
      data: { name, price, dataType, dataSizeGb, validityDays, deviceLimit, includesTv, description, badge: badge || null }
    });
    createdPlans.push(plan);
  }

  const allHostels = await prisma.hostel.findMany();
  for (const hostel of allHostels) {
    for (const plan of createdPlans) {
      await prisma.hostelPlan.upsert({
        where: { hostelId_planId: { hostelId: hostel.id, planId: plan.id } },
        update: {},
        create: { hostelId: hostel.id, planId: plan.id }
      });
    }
  }

  for (const [title, slug, content] of policies) {
    await prisma.policyPage.upsert({
      where: { slug },
      update: { title, content },
      create: { title, slug, content }
    });
  }
}

main().finally(async () => prisma.$disconnect());
