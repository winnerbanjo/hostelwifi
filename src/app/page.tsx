import Link from "next/link";
import { ArrowRight, CheckCircle2, CreditCard, Headphones, ShieldCheck, Wifi } from "lucide-react";
import { db } from "@/lib/db";
import { demoHostels, demoPlans, hasDatabaseUrl } from "@/lib/demo-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlanCard } from "@/components/plan-card";
import { business, whatsappLink } from "@/lib/constants";

export default async function Home() {
  const [hostels, plans] = hasDatabaseUrl
    ? await Promise.all([
        db.hostel.findMany({ where: { status: "active" }, orderBy: { name: "asc" } }),
        db.plan.findMany({ where: { status: "active" }, orderBy: { price: "asc" }, take: 3 })
      ])
    : [demoHostels, demoPlans.slice(0, 3)];

  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b border-line bg-white py-12 md:py-20">
          <div className="container grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="pill">Instant hostel WiFi vouchers</span>
              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-normal text-ink md:text-6xl">
                Fast Hostel Internet, Instant Voucher.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Choose your hostel, pick a plan, pay securely, and get your internet access code immediately.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/plans" className="btn btn-primary">Buy Internet Voucher <ArrowRight size={18} /></Link>
                <a href={whatsappLink("Hello Jendor The Plug, I need help buying a voucher.")} className="btn btn-ghost">Contact Support</a>
              </div>
            </div>
            <div className="card p-5 shadow-soft">
              <div className="flex items-center gap-3 border-b border-line pb-4">
                <span className="grid size-11 place-items-center rounded-lg bg-blue-50 text-ocean"><Wifi /></span>
                <div>
                  <p className="font-bold text-ink">Start here</p>
                  <p className="text-sm text-slate-500">Select your hostel to see plans.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {hostels.map((hostel) => (
                  <Link key={hostel.id} className="flex items-center justify-between rounded-lg border border-line p-4 font-semibold hover:border-brand" href={`/plans?hostelId=${hostel.id}`}>
                    {hostel.name}
                    <ArrowRight size={18} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="container">
            <div className="grid gap-4 md:grid-cols-4">
              {["Select your hostel", "Choose your internet plan", "Pay securely", "Get your voucher instantly"].map((step, index) => (
                <div key={step} className="rounded-lg border border-line p-5">
                  <span className="grid size-9 place-items-center rounded-lg bg-emerald-50 font-bold text-brand">{index + 1}</span>
                  <p className="mt-4 font-bold text-ink">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-slate-50 py-14">
          <div className="container">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-ink">Popular plans</h2>
                <p className="mt-2 text-slate-600">Clean pricing for quick student access.</p>
              </div>
              <Link href="/plans" className="hidden font-bold text-brand md:block">View all plans</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="container grid gap-4 md:grid-cols-3">
            <div className="flex gap-3 rounded-lg border border-line p-5"><ShieldCheck className="text-brand" /><div><p className="font-bold">Bank transfer payments</p><p className="text-sm text-slate-600">Admin confirms transfers before vouchers are released.</p></div></div>
            <div className="flex gap-3 rounded-lg border border-line p-5"><CreditCard className="text-brand" /><div><p className="font-bold">Bank transfer supported</p><p className="text-sm text-slate-600">Upload proof or reference, then admin releases voucher.</p></div></div>
            <div className="flex gap-3 rounded-lg border border-line p-5"><Headphones className="text-brand" /><div><p className="font-bold">WhatsApp-first support</p><p className="text-sm text-slate-600">{business.whatsapp}</p></div></div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
