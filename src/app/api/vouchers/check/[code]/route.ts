import { NextResponse } from "next/server";
import { networkProvider } from "@/lib/network-provider";

export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const voucher = await networkProvider.checkVoucherStatus(code.toUpperCase());
  if (!voucher) return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
  return NextResponse.json({ voucher });
}
