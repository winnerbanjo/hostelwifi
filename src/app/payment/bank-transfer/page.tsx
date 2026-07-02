import { db } from "@/lib/db";
import { demoOrder, hasDatabaseUrl } from "@/lib/demo-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { money, whatsappLink } from "@/lib/constants";
import { getBankDetails } from "@/lib/business-settings";
import { BankTransferForm } from "./transfer-form";

export default async function BankTransferPage({ searchParams }: { searchParams: Promise<{ reference?: string; planId?: string; hostelId?: string }> }) {
  const { reference, planId, hostelId } = await searchParams;
  const bank = await getBankDetails();
  const order = reference
    ? hasDatabaseUrl
      ? await db.order.findUnique({ where: { reference }, include: { plan: true, hostel: true } })
      : demoOrder(reference, "bank_transfer", planId, hostelId)
    : null;
  const amount = Number(order?.amount || 0);
  return (
    <>
      <SiteHeader />
      <main className="bg-slate-50 py-10">
        <div className="container max-w-3xl">
          <div className="card p-6">
            <h1 className="text-3xl font-black text-ink">Bank transfer pending</h1>
            <p className="mt-2 text-slate-600">Pay the exact amount, submit your transfer reference or proof link, and your voucher will be released after admin confirmation.</p>
            {order ? (
              <>
                <div className="mt-6 grid gap-3 rounded-lg border border-line bg-white p-4 text-sm">
                  <p><b>Amount:</b> {money(amount)}</p>
                  <p><b>Order reference:</b> {order.reference || reference}</p>
                  <p><b>Account number:</b> {bank.accountNumber}</p>
                  <p><b>Bank:</b> {bank.bankName}</p>
                  <p><b>Account name:</b> {bank.accountName}</p>
                </div>
                <BankTransferForm reference={order.reference || reference || ""} />
              </>
            ) : (
              <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 font-semibold text-red-700">Order not found. Please go back to checkout and try again.</p>
            )}
            <a className="btn btn-secondary mt-5 w-full" href={whatsappLink(`Hello Jendor The Plug, I made a bank transfer for order ${reference || ""}.`)}>Message support on WhatsApp</a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
