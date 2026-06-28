"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  async function submit(formData: FormData) {
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.get("email"), password: formData.get("password") })
    });
    if (!res.ok) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/admin");
  }
  return (
    <form action={submit} className="mt-6 grid gap-4">
      <input className="field" name="email" type="email" placeholder="Email" required />
      <input className="field" name="password" type="password" placeholder="Password" required />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="btn btn-primary">Login</button>
    </form>
  );
}
