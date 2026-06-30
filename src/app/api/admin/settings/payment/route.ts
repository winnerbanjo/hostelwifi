import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { defaultBankDetails, getBankDetails } from "@/lib/business-settings";
import { db } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/demo-data";

function clean(value: unknown) {
  return String(value || "").trim();
}

export async function GET() {
  await requireAdmin();
  return NextResponse.json({ bank: await getBankDetails(), demo: !hasDatabaseUrl });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  const data = await request.json();
  const accountNumber = clean(data.accountNumber);
  const bankName = clean(data.bankName);
  const accountName = clean(data.accountName);

  if (!accountNumber || !bankName || !accountName) {
    return NextResponse.json({ error: "Account number, bank name, and account name are required." }, { status: 400 });
  }

  if (!hasDatabaseUrl) {
    return NextResponse.json({
      bank: { accountNumber, bankName, accountName },
      demo: true,
      message: "Connect MONGODB_URI to save bank details permanently."
    });
  }

  const settings = await db.businessSettings.upsert({
    where: { id: "default" },
    update: {
      bankAccountNumber: accountNumber,
      bankName,
      bankAccountName: accountName
    },
    create: {
      id: "default",
      bankAccountNumber: accountNumber,
      bankName,
      bankAccountName: accountName
    }
  });

  await db.auditLog.create({
    data: {
      adminUserId: admin.id,
      action: "update_payment_settings",
      entityType: "BusinessSettings",
      entityId: settings.id,
      metadata: { previousFallback: defaultBankDetails }
    }
  });

  return NextResponse.json({
    bank: {
      accountNumber: settings.bankAccountNumber,
      bankName: settings.bankName,
      accountName: settings.bankAccountName
    }
  });
}
