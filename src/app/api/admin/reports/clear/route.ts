import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();

    // Check last clear date in settings
    const settings = await db.businessSettings.findUnique({ where: { id: "default" } });
    if (settings?.lastReportsClearedAt) {
      const lastCleared = new Date(settings.lastReportsClearedAt);
      const diffMs = Date.now() - lastCleared.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays < 30) {
        const remainingDays = Math.ceil(30 - diffDays);
        return NextResponse.json({
          error: `Reports can only be cleared once in 30 days. Please wait ${remainingDays} more day(s).`
        }, { status: 400 });
      }
    }

    // Clear reporting collections using native MongoDB
    const mongo = await db.$db();
    await Promise.all([
      mongo.collection("orders").deleteMany({}),
      mongo.collection("vouchers").deleteMany({}),
      mongo.collection("paymentLogs").deleteMany({}),
      mongo.collection("supportTickets").deleteMany({})
    ]);

    // Update settings timestamp
    const now = new Date();
    await db.businessSettings.upsert({
      where: { id: "default" },
      update: { lastReportsClearedAt: now },
      create: { id: "default", lastReportsClearedAt: now }
    });

    await db.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "clear_reports",
        entityType: "BusinessSettings",
        entityId: "default",
        metadata: { clearedAt: now }
      }
    });

    return NextResponse.json({ success: true, clearedAt: now });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An error occurred." }, { status: 400 });
  }
}
