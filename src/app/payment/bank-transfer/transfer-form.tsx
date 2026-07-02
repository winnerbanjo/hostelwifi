"use client";

import { useState } from "react";

export function BankTransferForm({ reference }: { reference: string }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/payments/bank-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          bankTransferReference: String(formData.get("bankTransferReference") || ""),
          bankTransferProofUrl: String(formData.get("bankTransferProofUrl") || "")
        })
      });
      if (!res.ok) throw new Error("Unable to submit transfer proof. Please check the reference and try again.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit transfer proof.");
    } finally {
      setLoading(false);
    }
  }

  return sent ? (
    <div className="mt-5 rounded-lg bg-emerald-50 p-4 font-semibold text-emerald-800">Submitted. Your voucher will be released after confirmation.</div>
  ) : (
    <form action={submit} className="mt-5 grid gap-3">
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
      <label className="grid gap-2 text-sm font-semibold">Transfer reference<input className="field" name="bankTransferReference" placeholder="Bank app transaction reference" /></label>
      <label className="grid gap-2 text-sm font-semibold">Payment proof URL<input className="field" name="bankTransferProofUrl" placeholder="Optional image/document link" /></label>
      <button disabled={loading || !reference} className="btn btn-primary">{loading ? "Submitting..." : "Submit transfer proof"}</button>
    </form>
  );
}
