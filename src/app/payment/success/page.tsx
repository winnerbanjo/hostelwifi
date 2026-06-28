import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { demoOrder, hasDatabaseUrl } from "@/lib/demo-data";
import { completePaidOrder } from "@/lib/orders";
import { verifyPaystack } from "@/lib/paystack";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { money, whatsappLink } from "@/lib/constants";
import { CopyButton } from "@/components/copy-button";

export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<{ reference?: string; demo?: string; planId?: string; hostelId?: string }> }) {
  const { reference, planId, hostelId } = await searchParams;
  let order = reference
    ? hasDatabaseUrl
      ? await prisma.order.findUnique({ where: { reference }, include: { hostel: true, plan: true, voucher: true } })
      : demoOrder(reference, "paystack", planId, hostelId)
    : null;
  let error = "";

  if (hasDatabaseUrl && reference && order?.paymentMethod === "paystack" && !order.voucher) {
    try {
      const verification = await verifyPaystack(reference);
      if (verification.status && verification.data?.status === "success") {
        order = await completePaidOrder(reference, "paystack", verification);
      } else {
        error = "Payment could not be verified.";
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Payment verification failed.";
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="bg-slate-50 py-10">
        <div className="container max-w-3xl">
          {!order || error ? (
            <div className="card p-7 text-center">
              <h1 className="text-2xl font-black text-ink">Payment verification pending</h1>
              <p className="mt-2 text-slate-600">{error || "We could not find this order yet."}</p>
              <Link href="/support" className="btn btn-primary mt-6">Contact support</Link>
            </div>
          ) : (
            <div className="card p-6 md:p-8">
              <div className="text-center">
                <CheckCircle2 className="mx-auto text-brand" size={48} />
                <h1 className="mt-4 text-3xl font-black text-ink">Payment Successful</h1>
                <p className="mt-2 text-slate-600">Your voucher has been generated. Do not share it beyond your allowed devices.</p>
              </div>
              <div className="mt-7 rounded-lg border border-dashed border-brand bg-emerald-50 p-5 text-center">
                <p className="text-sm font-bold text-emerald-700">Voucher code</p>
                <p className="mt-2 break-all text-4xl font-black tracking-normal text-ink">{order.voucher?.code}</p>
                {order.voucher?.code ? <CopyButton value={order.voucher.code} /> : null}
              </div>
              <div className="mt-6 grid gap-3 rounded-lg border border-line p-4 text-sm text-slate-600 md:grid-cols-2">
                <p><b>Plan:</b> {order.plan.name}</p>
                <p><b>Price:</b> {money(order.amount)}</p>
                <p><b>Hostel:</b> {order.hostel.name}</p>
                <p><b>Validity:</b> {order.plan.validityDays} day(s)</p>
                <p><b>Device limit:</b> {order.plan.deviceLimit}</p>
                <p><b>Expires:</b> {order.voucher?.expiresAt ? new Date(order.voucher.expiresAt).toLocaleString() : "After validity period"}</p>
              </div>
              <ol className="mt-6 grid gap-2 text-slate-700">
                <li>1. Connect to the hostel WiFi.</li>
                <li>2. Open your browser.</li>
                <li>3. Enter your voucher code on the WiFi login page.</li>
                <li>4. Start browsing.</li>
              </ol>
              <a className="btn btn-secondary mt-6 w-full" href={whatsappLink(`Hello Jendor The Plug, I need help with voucher ${order.voucher?.code}.`)}>
                <MessageCircle size={18} /> Support on WhatsApp
              </a>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
