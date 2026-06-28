import Link from "next/link";
import { business } from "@/lib/constants";

const policies = [
  ["Terms", "/policies/terms"],
  ["Privacy", "/policies/privacy"],
  ["Refunds", "/policies/refund"],
  ["Fair Usage", "/policies/fair-usage"],
  ["Usage Rules", "/policies/internet-usage-rules"]
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white py-10">
      <div className="container grid gap-6 text-sm text-slate-600 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="font-bold text-ink">{business.name}</p>
          <p className="mt-2 max-w-xl">{business.address}</p>
          <p className="mt-2">Phone: {business.phone}, {business.phoneAlt}</p>
          <p>Email: {business.email}</p>
        </div>
        <div className="flex flex-wrap gap-4 md:justify-end">
          {policies.map(([label, href]) => (
            <Link key={href} href={href} className="font-semibold text-slate-700">{label}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
