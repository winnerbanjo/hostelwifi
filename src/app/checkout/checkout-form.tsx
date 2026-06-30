"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { money } from "@/lib/constants";

type Props = {
  hostels: { id: string; name: string }[];
  plans: { id: string; name: string; price: number; validityDays: number; deviceLimit: number }[];
  initialHostelId?: string;
  initialPlanId?: string;
};

export function CheckoutForm({ hostels, plans, initialHostelId, initialPlanId }: Props) {
  const router = useRouter();
  const [hostelId, setHostelId] = useState(initialHostelId || hostels[0]?.id || "");
  const [planId, setPlanId] = useState(initialPlanId || plans[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const selectedPlan = plans.find((plan) => plan.id === planId);

  async function submit(formData: FormData) {
    setLoading(true);
    const payload = {
      hostelId,
      planId,
      fullName: String(formData.get("fullName") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
      roomNumber: String(formData.get("roomNumber") || ""),
      blockFloor: String(formData.get("blockFloor") || ""),
      paymentMethod: "bank_transfer"
    };
    const orderRes = await fetch("/api/orders/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const orderJson = await orderRes.json();
    if (!orderRes.ok) {
      alert("Please check your checkout details.");
      setLoading(false);
      return;
    }
    router.push(`/payment/bank-transfer?reference=${orderJson.order.reference}&planId=${planId}&hostelId=${hostelId}`);
  }

  return (
    <form action={submit} className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="card p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">Hostel<select className="field" value={hostelId} onChange={(event) => setHostelId(event.target.value)}>{hostels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-semibold">Plan<select className="field" value={planId} onChange={(event) => setPlanId(event.target.value)}>{plans.map((p) => <option key={p.id} value={p.id}>{p.name} - {money(p.price)}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-semibold">Full name<input required name="fullName" className="field" /></label>
          <label className="grid gap-2 text-sm font-semibold">Phone number<input required name="phone" className="field" /></label>
          <label className="grid gap-2 text-sm font-semibold">Email<input required type="email" name="email" className="field" /></label>
          <label className="grid gap-2 text-sm font-semibold">Room number<input required name="roomNumber" className="field" /></label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">Block/floor<input name="blockFloor" className="field" placeholder="Optional" /></label>
        </div>
        <div className="mt-5 rounded-lg border border-brand bg-emerald-50 p-4 text-sm font-semibold text-brand">Payment is by bank transfer. Your voucher will be released after admin confirmation.</div>
        <label className="mt-5 flex items-start gap-3 text-sm text-slate-600"><input required type="checkbox" className="mt-1" /> I agree to the terms, refund policy, and internet usage rules.</label>
      </div>
      <aside className="card h-fit p-5">
        <p className="text-sm font-semibold text-slate-500">Order summary</p>
        <h2 className="mt-2 text-xl font-black text-ink">{selectedPlan?.name}</h2>
        <p className="mt-4 text-3xl font-black text-ink">{money(selectedPlan?.price || 0)}</p>
        <div className="mt-4 grid gap-2 text-sm text-slate-600">
          <p>Validity: {selectedPlan?.validityDays} day(s)</p>
          <p>Devices: {selectedPlan?.deviceLimit}</p>
          <p>Payment: Bank transfer</p>
        </div>
        <button disabled={loading} className="btn btn-primary mt-6 w-full">{loading ? "Processing..." : "Continue to Bank Transfer"}</button>
      </aside>
    </form>
  );
}
