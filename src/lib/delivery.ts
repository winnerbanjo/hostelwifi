import { Order, Plan, Voucher, Hostel } from "@prisma/client";
import { business } from "@/lib/constants";

export type VoucherDeliveryPayload = {
  order: Order;
  voucher: Voucher;
  plan: Plan;
  hostel: Hostel;
};

export interface DeliveryProvider {
  sendVoucher(payload: VoucherDeliveryPayload): Promise<{ ok: boolean; detail: string }>;
}

export class EmailDeliveryProvider implements DeliveryProvider {
  async sendVoucher({ order, voucher, plan, hostel }: VoucherDeliveryPayload) {
    if (!process.env.RESEND_API_KEY) {
      console.info(`Email not sent. Configure RESEND_API_KEY. Voucher ${voucher.code} for ${order.email}`);
      return { ok: false, detail: "Email provider not configured" };
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || `Jendor The Plug <${business.email}>`,
        to: order.email,
        subject: `Your ${business.name} WiFi voucher`,
        html: `<p>Hello ${order.fullName},</p><p>Your voucher for ${hostel.name} is <strong>${voucher.code}</strong>.</p><p>Plan: ${plan.name}. Validity: ${plan.validityDays} day(s). Devices: ${plan.deviceLimit}.</p><p>Connect to the hostel WiFi, open your browser, and enter the voucher code.</p>`
      })
    });

    return { ok: response.ok, detail: response.ok ? "sent" : await response.text() };
  }
}

export class SmsDeliveryProvider implements DeliveryProvider {
  async sendVoucher() {
    return { ok: false, detail: "SMS provider not configured. Add Termii or Twilio later." };
  }
}

export class WhatsAppDeliveryProvider implements DeliveryProvider {
  async sendVoucher() {
    return { ok: false, detail: "WhatsApp provider not configured. Add WhatsApp Cloud API or Twilio later." };
  }
}

export async function deliverVoucher(payload: VoucherDeliveryPayload) {
  const email = await new EmailDeliveryProvider().sendVoucher(payload);
  return { email, sms: "pending provider", whatsapp: "pending provider" };
}
