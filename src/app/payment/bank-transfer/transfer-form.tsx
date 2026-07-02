"use client";

import type { FormEvent } from "react";
import { useState } from "react";

export function BankTransferForm({ reference }: { reference: string }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [receiptName, setReceiptName] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setLoading(true);
    try {
      const receipt = formData.get("receipt");
      if (!(receipt instanceof File) || !receipt.size) {
        throw new Error("Please upload your transfer receipt.");
      }

      const uploadData = new FormData();
      uploadData.set("reference", reference);
      uploadData.set("receipt", receipt);

      const uploadRes = await fetch("/api/uploads/receipt", {
        method: "POST",
        body: uploadData
      });
      const uploadJson = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || !uploadJson.url) {
        throw new Error(typeof uploadJson.error === "string" ? uploadJson.error : "Unable to upload receipt.");
      }

      const res = await fetch("/api/payments/bank-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          bankTransferReference: String(formData.get("bankTransferReference") || ""),
          bankTransferProofUrl: uploadJson.url
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
    <form onSubmit={submit} className="mt-5 grid gap-3">
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
      <label className="grid gap-2 text-sm font-semibold">Transfer reference<input className="field" name="bankTransferReference" placeholder="Bank app transaction reference" /></label>
      <label className="grid gap-2 text-sm font-semibold">
        Upload receipt
        <input
          className="field"
          name="receipt"
          type="file"
          accept="image/*,.pdf"
          required
          onChange={(event) => setReceiptName(event.target.files?.[0]?.name || "")}
        />
        {receiptName ? <span className="text-xs font-semibold text-slate-500">{receiptName}</span> : null}
      </label>
      <button disabled={loading || !reference} className="btn btn-primary">{loading ? "Uploading receipt..." : "Submit transfer proof"}</button>
    </form>
  );
}
