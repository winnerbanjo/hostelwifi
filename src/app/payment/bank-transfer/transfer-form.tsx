"use client";

import { useState } from "react";

export function BankTransferForm({ reference }: { reference: string }) {
  const [sent, setSent] = useState(false);

  async function submit(formData: FormData) {
    await fetch("/api/payments/bank-transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference,
        bankTransferReference: String(formData.get("bankTransferReference") || ""),
        bankTransferProofUrl: String(formData.get("bankTransferProofUrl") || "")
      })
    });
    setSent(true);
  }

  return sent ? (
    <div className="mt-5 rounded-lg bg-emerald-50 p-4 font-semibold text-emerald-800">Submitted. Your voucher will be released after confirmation.</div>
  ) : (
    <form action={submit} className="mt-5 grid gap-3">
      <label className="grid gap-2 text-sm font-semibold">Transfer reference<input className="field" name="bankTransferReference" placeholder="Bank app transaction reference" /></label>
      <label className="grid gap-2 text-sm font-semibold">Payment proof URL<input className="field" name="bankTransferProofUrl" placeholder="Optional image/document link" /></label>
      <button className="btn btn-primary">Submit transfer proof</button>
    </form>
  );
}
