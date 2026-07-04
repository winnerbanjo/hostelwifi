"use client";

import { useEffect, useMemo, useState } from "react";
import { business, money } from "@/lib/constants";

async function requestJson(path: string, options?: RequestInit) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error && typeof data.error === "string" ? data.error : "Request failed.");
  return data;
}

export function AccountClient() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [hostels, setHostels] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedHostel, setSelectedHostel] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function loadAccount() {
    const [account, hostelData] = await Promise.all([requestJson("/api/customer/me"), requestJson("/api/hostels")]);
    setCustomer(account.customer);
    setOrders(account.orders || []);
    setTransactions(account.walletTransactions || []);
    setHostels(hostelData.hostels || []);
    const firstHostel = selectedHostel || hostelData.hostels?.[0]?.id || "";
    if (firstHostel) {
      setSelectedHostel(firstHostel);
      const planData = await requestJson(`/api/hostels/${firstHostel}/plans`);
      setPlans(planData.plans || []);
    }
  }

  useEffect(() => {
    loadAccount().catch(() => {});
  }, []);

  async function loadPlans(hostelId: string) {
    setSelectedHostel(hostelId);
    const planData = await requestJson(`/api/hostels/${hostelId}/plans`);
    setPlans(planData.plans || []);
  }

  async function auth(formData: FormData) {
    setMessage(null);
    try {
      const body = Object.fromEntries(formData);

      if (mode === "forgot") {
        if (body.password !== body.confirmPassword) {
          setMessage({ type: "error", text: "Passwords do not match." });
          return;
        }
        await requestJson("/api/customer/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: body.email,
            phone: body.phone,
            newPassword: body.password
          })
        });
        setMessage({ type: "success", text: "Password reset successfully. You can now login." });
        setMode("login");
        return;
      }

      await requestJson(`/api/customer/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      setMessage({ type: "success", text: mode === "signup" ? "Account created." : "Logged in." });
      await loadAccount();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Unable to continue." });
    }
  }

  async function logout() {
    await requestJson("/api/customer/logout", { method: "POST" });
    setCustomer(null);
    setOrders([]);
    setTransactions([]);
  }

  async function topup(formData: FormData) {
    setMessage(null);
    try {
      await requestJson("/api/customer/topups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData))
      });
      setMessage({ type: "success", text: "Top-up submitted. Admin will confirm it after checking payment." });
      await loadAccount();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Unable to submit top-up." });
    }
  }

  async function buy(formData: FormData) {
    setMessage(null);
    try {
      await requestJson("/api/customer/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(formData), hostelId: selectedHostel })
      });
      setMessage({ type: "success", text: "Voucher purchased from wallet." });
      await loadAccount();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Unable to buy from wallet." });
    }
  }

  const latestVoucher = useMemo(() => orders.find((order) => order.voucher)?.voucher, [orders]);

  if (!customer) {
    return (
      <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <form action={auth} className="card grid gap-3 p-5">
          {message ? <FormMessage type={message.type}>{message.text}</FormMessage> : null}
          
          {mode === "forgot" ? (
            <p className="font-black text-ink text-lg">Reset Password</p>
          ) : (
            <div className="flex gap-2">
              <button type="button" className={`btn px-4 py-2 ${mode === "login" ? "btn-primary" : "btn-ghost"}`} onClick={() => setMode("login")}>Login</button>
              <button type="button" className={`btn px-4 py-2 ${mode === "signup" ? "btn-primary" : "btn-ghost"}`} onClick={() => setMode("signup")}>Create account</button>
            </div>
          )}

          {mode === "signup" ? <input className="field" name="fullName" placeholder="Full name" required /> : null}
          {mode === "signup" || mode === "forgot" ? <input className="field" name="phone" placeholder="Phone number" required /> : null}
          <input className="field" name="email" type="email" placeholder="Email address" required />
          <input className="field" name="password" type="password" placeholder={mode === "forgot" ? "New password" : "Password"} required />
          {mode === "forgot" ? <input className="field" name="confirmPassword" type="password" placeholder="Confirm new password" required /> : null}
          
          <button className="btn btn-primary">
            {mode === "signup" ? "Create account" : mode === "forgot" ? "Reset password" : "Login"}
          </button>

          {mode === "login" ? (
            <button type="button" className="text-left text-xs font-bold text-brand hover:underline mt-1" onClick={() => setMode("forgot")}>
              Forgot password?
            </button>
          ) : mode === "forgot" ? (
            <button type="button" className="text-left text-xs font-bold text-brand hover:underline mt-1" onClick={() => setMode("login")}>
              Back to Login
            </button>
          ) : null}
        </form>
        <div className="card p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-brand">Bank transfer</p>
          <div className="mt-4 grid gap-2 text-sm">
            <p><b>Account number:</b> {business.bank.accountNumber}</p>
            <p><b>Bank:</b> {business.bank.bankName}</p>
            <p><b>Account name:</b> {business.bank.accountName}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {message ? <FormMessage type={message.type}>{message.text}</FormMessage> : null}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-500">Wallet balance</p>
          <p className="mt-2 text-3xl font-black text-ink">{money(customer.walletBalance || 0)}</p>
          <p className="mt-1 text-sm text-slate-500">{customer.fullName}</p>
          <button className="btn btn-ghost mt-4 px-4 py-2 text-sm" onClick={logout}>Logout</button>
        </div>
        <form action={topup} className="card grid gap-3 p-5 lg:col-span-2">
          <p className="font-black text-ink">Add money to wallet</p>
          <div className="rounded-lg bg-slate-100 p-3 text-sm">
            Transfer to {business.bank.accountNumber} - {business.bank.bankName} - {business.bank.accountName}
          </div>
          <input className="field" name="amount" type="number" min="1" placeholder="Amount paid" required />
          <input className="field" name="bankTransferReference" placeholder="Transfer reference or sender name" />
          <input className="field" name="bankTransferProofUrl" placeholder="Proof image link optional" />
          <button className="btn btn-primary">Submit top-up</button>
        </form>
      </div>

      <form action={buy} className="card grid gap-3 p-5 md:grid-cols-2">
        <p className="font-black text-ink md:col-span-2">Buy plan with wallet</p>
        <select className="field" value={selectedHostel} onChange={(event) => loadPlans(event.target.value)} required>
          {hostels.map((hostel) => <option key={hostel.id} value={hostel.id}>{hostel.name}</option>)}
        </select>
        <select className="field" name="planId" required>
          {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} - {money(plan.price)}</option>)}
        </select>
        <input className="field" name="roomNumber" placeholder="Room number" required />
        <input className="field" name="blockFloor" placeholder="Block/floor optional" />
        <button className="btn btn-primary md:col-span-2">Buy from wallet</button>
      </form>

      {latestVoucher ? <div className="card p-5"><p className="text-sm font-semibold text-slate-500">Latest voucher</p><p className="mt-2 text-2xl font-black text-ink">{latestVoucher.code}</p></div> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <History title="Wallet history" rows={transactions.map((item) => [item.type, money(item.amount), item.status, new Date(item.createdAt).toLocaleDateString()])} />
        <History title="Orders" rows={orders.map((item) => [item.reference, item.plan?.name || "-", item.paymentStatus, item.voucher?.code || "-"])} />
      </div>
    </div>
  );
}

function History({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="card overflow-x-auto p-5">
      <p className="mb-3 font-black text-ink">{title}</p>
      <table className="w-full text-left text-sm">
        <tbody>{rows.map((row, index) => <tr key={index} className="border-t border-line">{row.map((cell) => <td key={cell} className="py-3 pr-3">{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function FormMessage({ type, children }: { type: "error" | "success"; children: React.ReactNode }) {
  const styles = type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return <div className={`rounded-lg border p-3 text-sm font-semibold ${styles}`}>{children}</div>;
}
