import { db } from "@/lib/db";
import { demoHostels, hasDatabaseUrl } from "@/lib/demo-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SupportForm } from "./support-form";

export default async function SupportPage() {
  const hostels = hasDatabaseUrl
    ? await db.hostel.findMany({ where: { status: "active" }, orderBy: { name: "asc" } })
    : demoHostels;
  return (
    <>
      <SiteHeader />
      <main className="bg-slate-50 py-10">
        <div className="container max-w-3xl">
          <h1 className="text-3xl font-black text-ink">Support</h1>
          <p className="mt-2 text-slate-600">Submit a complaint and the admin team can track it from the dashboard.</p>
          <SupportForm hostels={hostels} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
