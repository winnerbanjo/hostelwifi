import { prisma } from "@/lib/db";
import { demoHostels, demoPlans, hasDatabaseUrl } from "@/lib/demo-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlanCard } from "@/components/plan-card";

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ hostelId?: string }> }) {
  const { hostelId } = await searchParams;
  const hostels = hasDatabaseUrl
    ? await prisma.hostel.findMany({ where: { status: "active" }, orderBy: { name: "asc" } })
    : demoHostels;
  const selectedHostel = hostelId || hostels[0]?.id;
  const rows = hasDatabaseUrl && selectedHostel
    ? await prisma.hostelPlan.findMany({ where: { hostelId: selectedHostel, status: "active", plan: { status: "active" } }, include: { plan: true }, orderBy: { plan: { price: "asc" } } })
    : demoPlans.map((plan) => ({ plan }));

  return (
    <>
      <SiteHeader />
      <main className="bg-slate-50 py-10">
        <div className="container">
          <h1 className="text-3xl font-black text-ink">Choose your internet plan</h1>
          <p className="mt-2 text-slate-600">Select hostel first, then buy the plan that fits.</p>
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {hostels.map((hostel) => (
              <a key={hostel.id} href={`/plans?hostelId=${hostel.id}`} className={`shrink-0 rounded-lg border px-4 py-3 text-sm font-bold ${selectedHostel === hostel.id ? "border-brand bg-emerald-50 text-brand" : "border-line bg-white text-slate-700"}`}>
                {hostel.name}
              </a>
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => <PlanCard key={row.plan.id} plan={row.plan} hostelId={selectedHostel} />)}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
