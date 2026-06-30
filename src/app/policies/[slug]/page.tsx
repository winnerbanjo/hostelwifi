import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { demoPolicies, hasDatabaseUrl } from "@/lib/demo-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = hasDatabaseUrl
    ? await db.policyPage.findUnique({ where: { slug } })
    : demoPolicies[slug as keyof typeof demoPolicies];
  if (!policy) notFound();
  return (
    <>
      <SiteHeader />
      <main className="py-10">
        <article className="container max-w-3xl">
          <h1 className="text-3xl font-black text-ink">{policy.title}</h1>
          <div className="mt-6 whitespace-pre-line rounded-lg border border-line p-6 leading-8 text-slate-700">{policy.content}</div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
