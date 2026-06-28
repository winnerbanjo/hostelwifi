import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VoucherChecker } from "./voucher-checker";

export default function VoucherCheckerPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-slate-50 py-10">
        <div className="container max-w-2xl">
          <h1 className="text-3xl font-black text-ink">Voucher checker</h1>
          <p className="mt-2 text-slate-600">Enter your voucher code to confirm status, plan, hostel, and expiry.</p>
          <VoucherChecker />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
