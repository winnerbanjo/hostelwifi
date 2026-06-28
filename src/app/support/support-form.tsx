"use client";

import { useState } from "react";

const issues = ["I paid but did not receive voucher", "Voucher not working", "Internet is slow", "WiFi is not showing", "Wrong plan purchased", "I want a refund", "Other"];

export function SupportForm({ hostels }: { hostels: { id: string; name: string }[] }) {
  const [done, setDone] = useState(false);
  async function submit(formData: FormData) {
    await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    setDone(true);
  }
  return done ? <div className="card mt-6 p-6 font-semibold text-emerald-700">Complaint submitted. Support will contact you.</div> : (
    <form action={submit} className="card mt-6 grid gap-4 p-5 md:grid-cols-2">
      <input className="field" required name="fullName" placeholder="Full name" />
      <input className="field" required name="phone" placeholder="Phone number" />
      <input className="field" type="email" name="email" placeholder="Email" />
      <select className="field" name="hostelId"><option value="">Select hostel</option>{hostels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select>
      <input className="field" name="roomNumber" placeholder="Room number" />
      <select className="field" required name="issueType">{issues.map((issue) => <option key={issue}>{issue}</option>)}</select>
      <input className="field md:col-span-2" name="codeOrReference" placeholder="Voucher code or order reference" />
      <textarea className="field min-h-32 md:col-span-2" required name="message" placeholder="Message" />
      <input className="field md:col-span-2" name="screenshotUrl" placeholder="Screenshot URL, optional" />
      <button className="btn btn-primary md:col-span-2">Submit complaint</button>
    </form>
  );
}
