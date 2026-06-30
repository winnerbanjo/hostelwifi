import { db } from "@/lib/db";
import { demoHostels, demoPlans, hasDatabaseUrl } from "@/lib/demo-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ hostelId?: string; planId?: string }> }) {
  const params = await searchParams;
  const [hostels, plans] = hasDatabaseUrl
    ? await Promise.all([
        db.hostel.findMany({ where: { status: "active" }, orderBy: { name: "asc" } }),
        db.plan.findMany({ where: { status: "active" }, orderBy: { price: "asc" } })
      ])
    : [demoHostels, demoPlans];
  return (
    <>
      <SiteHeader />
      <main className="bg-slate-50 py-10">
        <div className="container">
          <h1 className="text-3xl font-black text-ink">Checkout</h1>
          <p className="mt-2 text-slate-600">Pay securely and receive your voucher after payment confirmation.</p>
          <div className="mt-7"><CheckoutForm hostels={hostels} plans={plans} initialHostelId={params.hostelId} initialPlanId={params.planId} /></div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
