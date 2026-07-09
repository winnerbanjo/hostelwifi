import { db } from "@/lib/db";
import { demoHostels, demoPlans, hasDatabaseUrl } from "@/lib/demo-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlanCard } from "@/components/plan-card";
import { AccountClient } from "@/app/account/account-client";
import { notFound } from "next/navigation";

export default async function HostelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const hostel = hasDatabaseUrl
    ? await db.hostel.findUnique({ where: { id } })
    : demoHostels.find((h) => h.id === id);

  if (!hostel) {
    notFound();
  }

  const rows = hasDatabaseUrl
    ? await db.hostelPlan.findMany({
        where: { hostelId: id, status: "active", plan: { status: "active" } },
        include: { plan: true },
        orderBy: { plan: { price: "asc" } }
      })
    : demoPlans.map((plan) => ({ plan }));

  return (
    <>
      <SiteHeader />
      <main className="bg-slate-50 py-10">
        <div className="container grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h1 className="text-3xl font-black text-ink">{hostel.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{hostel.address || ""}</p>
            <p className="mt-2 text-slate-600">Available plans at this hostel location:</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {rows.map((row) => <PlanCard key={row.plan.id} plan={row.plan} hostelId={id} />)}
            </div>
          </div>
          <div>
            <p className="font-black text-ink text-lg mb-4">Hostel Account Login / Signup</p>
            <AccountClient hostelId={id} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
