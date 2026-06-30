import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supportSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const parsed = supportSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  const order = data.codeOrReference
    ? await db.order.findFirst({ where: { reference: data.codeOrReference } })
    : null;
  const voucher = data.codeOrReference
    ? await db.voucher.findFirst({ where: { code: data.codeOrReference.toUpperCase() } })
    : null;
  const ticket = await db.supportTicket.create({
    data: {
      fullName: data.fullName,
      phone: data.phone,
      email: data.email || null,
      hostelId: data.hostelId || null,
      orderId: order?.id,
      voucherId: voucher?.id,
      issueType: data.issueType,
      message: `${data.roomNumber ? `Room: ${data.roomNumber}\n` : ""}${data.message}`,
      screenshotUrl: data.screenshotUrl || null
    }
  });
  return NextResponse.json({ ticket });
}
