"use client";

import { useState } from "react";
import { whatsappLink } from "@/lib/constants";

export function VoucherChecker() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function submit(formData: FormData) {
    setError("");
    setResult(null);
    const code = String(formData.get("code") || "").trim();
    const res = await fetch(`/api/vouchers/check/${encodeURIComponent(code)}`);
    const json = await res.json();
    if (!res.ok) setError(json.error || "Voucher not found");
    else setResult(json.voucher);
  }

  return (
    <div className="card mt-6 p-5">
      <form action={submit} className="flex flex-col gap-3 sm:flex-row">
        <input name="code" className="field" placeholder="JTP-7K4D-92PQ" />
        <button className="btn btn-primary">Check</button>
      </form>
      {error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p> : null}
      {result ? (
        <div className="mt-5 grid gap-2 text-sm text-slate-700">
          <p><b>Status:</b> {result.status}</p>
          <p><b>Plan:</b> {result.plan.name}</p>
          <p><b>Hostel:</b> {result.hostel.name}</p>
          <p><b>Validity:</b> {result.validityDays} day(s)</p>
          <p><b>Devices:</b> {result.deviceLimit}</p>
          <p><b>Purchased:</b> {new Date(result.createdAt).toLocaleString()}</p>
          <p><b>Expiry:</b> {result.expiresAt ? new Date(result.expiresAt).toLocaleString() : "Not set"}</p>
          <a className="btn btn-secondary mt-3" href={whatsappLink(`Hello Jendor The Plug, I need support for voucher ${result.code}.`)}>Support on WhatsApp</a>
        </div>
      ) : null}
    </div>
  );
}
