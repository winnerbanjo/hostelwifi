import Link from "next/link";
import { Monitor, Smartphone, Timer, Wifi } from "lucide-react";
import { money } from "@/lib/constants";

type Plan = {
  id: string;
  name: string;
  price: number;
  dataType: string;
  dataSizeGb: number | null;
  validityDays: number;
  deviceLimit: number;
  includesTv: boolean;
  description: string | null;
  badge: string | null;
};

export function PlanCard({ plan, hostelId }: { plan: Plan; hostelId?: string }) {
  return (
    <article className="card flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink">{plan.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
        </div>
        {plan.badge ? <span className="pill shrink-0">{plan.badge}</span> : null}
      </div>
      <p className="mt-5 text-3xl font-black tracking-normal text-ink">{money(plan.price)}</p>
      <div className="mt-5 grid gap-3 text-sm text-slate-600">
        <span className="flex items-center gap-2"><Wifi size={16} /> {plan.dataType === "unlimited" ? "Unlimited data" : `${plan.dataSizeGb}GB data`}</span>
        <span className="flex items-center gap-2"><Timer size={16} /> {plan.validityDays === 1 ? "1 day" : `${plan.validityDays} days`}</span>
        <span className="flex items-center gap-2"><Smartphone size={16} /> {plan.deviceLimit} device{plan.deviceLimit > 1 ? "s" : ""}</span>
        {plan.includesTv ? <span className="flex items-center gap-2"><Monitor size={16} /> TV access included</span> : null}
      </div>
      <Link className="btn btn-primary mt-6 w-full" href={`/checkout?planId=${plan.id}${hostelId ? `&hostelId=${hostelId}` : ""}`}>
        Buy Plan
      </Link>
    </article>
  );
}
