import { SiteHeader } from "@/components/site-header";
import { business } from "@/lib/constants";
import { AccountClient } from "./account-client";

export const dynamic = "force-dynamic";

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="container py-8">
        <div className="mb-6 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wide text-brand">Customer account</p>
          <h1 className="mt-2 text-3xl font-black text-ink md:text-4xl">Save money, top up, and buy WiFi from your balance.</h1>
          <p className="mt-3 text-slate-600">
            Add money by bank transfer to {business.bank.bankName}, wait for admin confirmation, then use your balance to buy a voucher anytime.
          </p>
        </div>
        <AccountClient />
      </section>
    </main>
  );
}
