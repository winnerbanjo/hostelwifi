import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { business } from "@/lib/constants";

const defaultSupportContacts = [
  { id: "1", name: "WhatsApp Support 1", phone: business.phone },
  { id: "2", name: "WhatsApp Support 2", phone: business.phoneAlt || business.whatsapp }
];

export async function GET() {
  try {
    await requireAdmin();
    const settings = await db.businessSettings.findUnique({ where: { id: "default" } });
    const contacts = settings?.supportContacts || defaultSupportContacts;
    return NextResponse.json({ supportContacts: contacts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An error occurred." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const { supportContacts } = await request.json();

    if (!Array.isArray(supportContacts)) {
      return NextResponse.json({ error: "Support contacts list must be an array." }, { status: 400 });
    }

    // Validate contacts format
    for (const contact of supportContacts) {
      if (!contact.id || !contact.name || !contact.phone) {
        return NextResponse.json({ error: "Each contact must have id, name, and phone fields." }, { status: 400 });
      }
    }

    const settings = await db.businessSettings.upsert({
      where: { id: "default" },
      update: { supportContacts },
      create: { id: "default", supportContacts }
    });

    await db.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "update_support_contacts",
        entityType: "BusinessSettings",
        entityId: "default",
        metadata: { count: supportContacts.length }
      }
    });

    return NextResponse.json({ supportContacts: settings.supportContacts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An error occurred." }, { status: 400 });
  }
}
