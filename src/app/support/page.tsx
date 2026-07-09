import { db } from "@/lib/db";
import { demoHostels, hasDatabaseUrl } from "@/lib/demo-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SupportForm } from "./support-form";
import { getSupportContacts } from "@/lib/business-settings";
import { MessageCircle } from "lucide-react";

export default async function SupportPage() {
  const [hostels, supportContacts] = await Promise.all([
    hasDatabaseUrl
      ? db.hostel.findMany({ where: { status: "active" }, orderBy: { name: "asc" } })
      : Promise.resolve(demoHostels),
    getSupportContacts()
  ]);

  return (
    <>
      <SiteHeader />
      <main className="bg-slate-50 py-10">
        <div className="container max-w-3xl">
          <h1 className="text-3xl font-black text-ink">Support & Inquiries</h1>
          <p className="mt-2 text-slate-600">Submit a complaint below or chat with our active support contacts directly on WhatsApp:</p>
          
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {supportContacts.map((contact) => (
              <a 
                key={contact.id} 
                className="btn btn-secondary flex items-center justify-between p-4 bg-white border border-line hover:border-brand shadow-sm font-semibold rounded-lg text-slate-700"
                href={`https://wa.me/234${contact.phone.startsWith("0") ? contact.phone.slice(1) : contact.phone}?text=${encodeURIComponent("Hello " + contact.name + ", I need help with hostel WiFi.")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle size={18} className="text-brand" />
                  {contact.name}
                </span>
                <span className="text-xs text-slate-500 font-normal">{contact.phone}</span>
              </a>
            ))}
          </div>

          <div className="border-t border-line my-8"></div>

          <p className="text-sm font-bold uppercase text-slate-500 tracking-wide">File a Support Ticket</p>
          <SupportForm hostels={hostels} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
