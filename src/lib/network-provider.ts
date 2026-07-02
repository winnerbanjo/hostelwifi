import { db } from "@/lib/db";

export type VoucherInput = {
  orderId: string;
  customerId: string;
  hostelId: string;
  planId: string;
  validityDays: number;
  deviceLimit: number;
  dataSizeGb?: number | null;
};

export interface NetworkProvider {
  generateVoucher(input: VoucherInput, tx?: any): Promise<any>;
  revokeVoucher(voucherCode: string): Promise<any>;
  checkVoucherStatus(voucherCode: string): Promise<any | null>;
}

function segment() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export class InternalVoucherProvider implements NetworkProvider {
  async generateVoucher(input: VoucherInput, tx: any = db) {
    const existing = await tx.voucher.findUnique({ where: { orderId: input.orderId } });
    if (existing) return existing;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const code = `JTP-${segment()}-${segment()}`;
      try {
        return await tx.voucher.create({
          data: {
            code,
            orderId: input.orderId,
            customerId: input.customerId,
            hostelId: input.hostelId,
            planId: input.planId,
            validityDays: input.validityDays,
            deviceLimit: input.deviceLimit,
            dataSizeGb: input.dataSizeGb,
            expiresAt: new Date(Date.now() + input.validityDays * 24 * 60 * 60 * 1000)
          }
        });
      } catch (error) {
        if (attempt === 11) throw error;
      }
    }
    throw new Error("Unable to generate a unique voucher code");
  }

  revokeVoucher(voucherCode: string) {
    return db.voucher.update({
      where: { code: voucherCode },
      data: { status: "revoked", revokedAt: new Date() }
    });
  }

  checkVoucherStatus(voucherCode: string) {
    return db.voucher.findUnique({
      where: { code: voucherCode },
      include: { hostel: true, plan: true, order: true }
    });
  }
}

export const networkProvider: NetworkProvider = new InternalVoucherProvider();

export class MikroTikVoucherProvider implements NetworkProvider {
  generateVoucher(): Promise<any> {
    throw new Error("MikroTik integration is not configured yet.");
  }
  revokeVoucher(): Promise<any> {
    throw new Error("MikroTik integration is not configured yet.");
  }
  checkVoucherStatus(): Promise<any | null> {
    throw new Error("MikroTik integration is not configured yet.");
  }
}
