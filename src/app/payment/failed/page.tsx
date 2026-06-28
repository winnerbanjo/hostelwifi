import Link from "next/link";
import { XCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { whatsappLink } from "@/lib/constants";

export default async function PaymentFailedPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const params = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="bg-slate-50 py-14">
        <div className="container max-w-xl">
          <div className="card p-7 text-center">
            <XCircle className="mx-auto text-red-500" size={50} />
            <h1 className="mt-4 text-3xl font-black text-ink">Payment Failed</h1>
            <p className="mt-2 text-slate-600">{params.reason || "The payment was not completed or could not be verified."}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link className="btn btn-primary" href="/plans">Retry payment</Link>
              <a className="btn btn-ghost" href={whatsappLink("Hello Jendor The Plug, my payment failed and I need help.")}>Contact support</a>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
