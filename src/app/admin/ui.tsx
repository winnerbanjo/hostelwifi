"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, LogOut, RefreshCw } from "lucide-react";
import { money, whatsappLink } from "@/lib/constants";

const tabs = ["Overview", "Orders", "Vouchers", "Hostels", "Plans", "Wallet", "Settings", "Support", "Reports", "Policies", "Customers"];

async function getJson(path: string) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(await responseError(res, path));
  return res.json();
}

async function responseError(res: Response, fallback: string) {
  try {
    const data = await res.json();
    if (typeof data.error === "string") return data.error;
    if (data.error) return JSON.stringify(data.error);
  } catch {}
  return fallback;
}

async function sendJson(path: string, options: RequestInit) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(await responseError(res, "Request failed"));
  return res.json();
}

export function AdminDashboard({ adminName }: { adminName: string }) {
  const [tab, setTab] = useState("Overview");
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setNotice(null);
    try {
      const [dashboard, orders, vouchers, hostels, plans, walletTopups, settings, tickets, policies, customers, sales, hostelReports, planReports, voucherReports, failed] = await Promise.all([
        getJson("/api/admin/dashboard"),
        getJson("/api/admin/orders"),
        getJson("/api/admin/vouchers"),
        getJson("/api/admin/hostels"),
        getJson("/api/admin/plans"),
        getJson("/api/admin/wallet-topups"),
        getJson("/api/admin/settings/payment"),
        getJson("/api/admin/support"),
        getJson("/api/admin/policies"),
        getJson("/api/admin/customers"),
        getJson("/api/admin/reports/sales"),
        getJson("/api/admin/reports/hostels"),
        getJson("/api/admin/reports/plans"),
        getJson("/api/admin/reports/vouchers"),
        getJson("/api/admin/reports/failed-payments")
      ]);
      setData({ dashboard, orders, vouchers, hostels, plans, walletTopups, settings, tickets, policies, customers, sales, hostelReports, planReports, voucherReports, failed });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-line bg-white">
        <div className="container flex h-16 items-center justify-between">
          <div>
            <p className="font-black text-ink">Jendor Admin</p>
            <p className="text-xs text-slate-500">{adminName}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost px-3 py-2 text-sm" onClick={load}><RefreshCw size={16} /> {loading ? "Loading" : "Refresh"}</button>
            <button className="btn btn-ghost px-3 py-2 text-sm" onClick={logout}><LogOut size={16} /> Logout</button>
          </div>
        </div>
      </header>
      <div className="container py-6">
        <div className="flex gap-2 overflow-x-auto pb-3">
          {tabs.map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold ${tab === item ? "bg-ink text-white" : "border border-line bg-white text-slate-700"}`}>{item}</button>
          ))}
        </div>
        <section className="mt-4">
          {notice ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{notice}</div> : null}
          {tab === "Overview" ? <Overview metrics={data.dashboard?.metrics} /> : null}
          {tab === "Orders" ? <Orders rows={data.orders?.orders || []} reload={load} /> : null}
          {tab === "Vouchers" ? <Vouchers rows={data.vouchers?.vouchers || []} reload={load} /> : null}
          {tab === "Hostels" ? <Hostels rows={data.hostels?.hostels || []} reload={load} /> : null}
          {tab === "Plans" ? <Plans rows={data.plans?.plans || []} reload={load} /> : null}
          {tab === "Wallet" ? <WalletTopups rows={data.walletTopups?.topups || []} reload={load} /> : null}
          {tab === "Settings" ? <Settings bank={data.settings?.bank} reload={load} /> : null}
          {tab === "Support" ? <Support rows={data.tickets?.tickets || []} reload={load} /> : null}
          {tab === "Reports" ? <Reports data={data} /> : null}
          {tab === "Policies" ? <Policies rows={data.policies?.policies || []} reload={load} /> : null}
          {tab === "Customers" ? <Customers rows={data.customers?.customers || []} /> : null}
        </section>
      </div>
    </main>
  );
}

function Overview({ metrics }: { metrics?: any }) {
  const cards = metrics ? [
    ["Total revenue", money(metrics.totalRevenue)],
    ["Today revenue", money(metrics.todayRevenue)],
    ["Total orders", metrics.totalOrders],
    ["Successful payments", metrics.successfulPayments],
    ["Pending bank transfers", metrics.pendingBankTransfers],
    ["Failed payments", metrics.failedPayments],
    ["Vouchers generated", metrics.vouchersGenerated],
    ["Active vouchers", metrics.activeVouchers],
    ["Support complaints", metrics.supportComplaints],
    ["Top plan", metrics.topSellingPlan],
    ["Top hostel", metrics.topHostelByRevenue]
  ] : [];
  return <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="card p-5"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-ink">{value}</p></div>)}</div>;
}

function Orders({ rows, reload }: { rows: any[]; reload: () => void }) {
  const [error, setError] = useState<string | null>(null);
  async function action(path: string, method = "PATCH", body?: any) {
    setError(null);
    try {
      await sendJson(path, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order action failed.");
    }
  }
  return (
    <>
      {error ? <FormMessage type="error">{error}</FormMessage> : null}
      <Table headers={["Reference", "Customer", "Hostel", "Plan", "Amount", "Payment", "Voucher", "Actions"]}>
        {rows.map((o) => (
          <tr key={o.id}>
            <td>{o.reference}</td><td>{o.fullName}<br /><span>{o.phone}</span></td><td>{o.hostel.name}</td><td>{o.plan.name}</td><td>{money(o.amount)}</td><td>{o.paymentStatus}</td><td>{o.voucher?.code || "-"}</td>
            <td className="min-w-48">
              {o.paymentStatus === "awaiting_bank_confirmation" ? <button className="btn btn-primary mr-2 px-3 py-2 text-xs" onClick={() => action(`/api/admin/orders/${o.id}/confirm-bank-transfer`)}>Confirm</button> : null}
              {o.paymentStatus === "awaiting_bank_confirmation" ? <button className="btn btn-ghost mr-2 px-3 py-2 text-xs" onClick={() => action(`/api/admin/orders/${o.id}/reject-bank-transfer`, "PATCH", { reason: "Payment not confirmed" })}>Reject</button> : null}
              {o.voucher ? <button className="btn btn-ghost px-3 py-2 text-xs" onClick={() => action(`/api/admin/orders/${o.id}/resend-voucher`, "POST")}>Resend</button> : null}
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}

function Vouchers({ rows, reload }: { rows: any[]; reload: () => void }) {
  async function revoke(id: string) {
    await fetch(`/api/admin/vouchers/${id}/revoke`, { method: "PATCH" });
    reload();
  }
  return <Table headers={["Code", "Customer", "Hostel", "Plan", "Status", "Expiry", "Actions"]}>{rows.map((v) => <tr key={v.id}><td className="font-bold">{v.code}</td><td>{v.customer.fullName}</td><td>{v.hostel.name}</td><td>{v.plan.name}</td><td>{v.status}</td><td>{v.expiresAt ? new Date(v.expiresAt).toLocaleDateString() : "-"}</td><td><button className="btn btn-ghost px-3 py-2 text-xs" onClick={() => revoke(v.id)}>Revoke</button></td></tr>)}</Table>;
}

function Hostels({ rows, reload }: { rows: any[]; reload: () => void }) {
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  async function submit(formData: FormData) {
    setMessage(null);
    try {
      await sendJson("/api/admin/hostels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(formData)) });
      setMessage({ type: "success", text: "Hostel added." });
      await reload();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Unable to add hostel." });
    }
  }
  async function save(id: string, formData: FormData) {
    setMessage(null);
    try {
      await sendJson(`/api/admin/hostels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData))
      });
      setMessage({ type: "success", text: "Hostel updated." });
      await reload();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Unable to update hostel." });
    }
  }
  return (
    <>
      {message ? <FormMessage type={message.type}>{message.text}</FormMessage> : null}
      <AdminForm action={submit} fields={["name", "address", "wifiSsid", "supportPhone"]} button="Add hostel" />
      <div className="grid gap-4">
        {rows.map((h) => (
          <form key={h.id} action={save.bind(null, h.id)} className="card grid gap-3 p-4 md:grid-cols-5">
            <input className="field" name="name" defaultValue={h.name} required />
            <input className="field" name="address" defaultValue={h.address || ""} />
            <input className="field" name="wifiSsid" defaultValue={h.wifiSsid || ""} />
            <input className="field" name="supportPhone" defaultValue={h.supportPhone || ""} />
            <select className="field" name="status" defaultValue={h.status || "active"}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="btn btn-primary md:col-span-5">Save hostel</button>
          </form>
        ))}
      </div>
    </>
  );
}

function Plans({ rows, reload }: { rows: any[]; reload: () => void }) {
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  async function submit(formData: FormData) {
    const obj = Object.fromEntries(formData);
    setMessage(null);
    try {
      await sendJson("/api/admin/plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...obj, assignAllHostels: true, includesTv: obj.includesTv === "on" }) });
      setMessage({ type: "success", text: "Plan added." });
      await reload();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Unable to add plan." });
    }
  }
  async function save(id: string, formData: FormData) {
    const obj = Object.fromEntries(formData);
    setMessage(null);
    try {
      await sendJson(`/api/admin/plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...obj, includesTv: obj.includesTv === "on" })
      });
      setMessage({ type: "success", text: "Plan updated." });
      await reload();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Unable to update plan." });
    }
  }
  return (
    <>
      {message ? <FormMessage type={message.type}>{message.text}</FormMessage> : null}
      <form action={submit} className="card mb-5 grid gap-3 p-4 md:grid-cols-4">
        <input className="field" name="name" placeholder="Plan name" required />
        <input className="field" name="price" type="number" min="1" placeholder="Price" required />
        <input className="field" name="validityDays" type="number" min="1" placeholder="Validity days" required />
        <input className="field" name="deviceLimit" type="number" min="1" placeholder="Devices" required />
        <select className="field" name="dataType"><option value="unlimited">Unlimited</option><option value="limited">Limited</option></select>
        <input className="field" name="dataSizeGb" type="number" min="1" placeholder="GB optional" />
        <input className="field" name="badge" placeholder="Badge" />
        <label className="flex items-center gap-2 text-sm font-semibold"><input name="includesTv" type="checkbox" /> TV access</label>
        <button className="btn btn-primary md:col-span-4">Add plan</button>
      </form>
      <div className="grid gap-4">
        {rows.map((p) => (
          <form key={p.id} action={save.bind(null, p.id)} className="card grid gap-3 p-4 md:grid-cols-6">
            <input className="field" name="name" defaultValue={p.name} required />
            <input className="field" name="price" type="number" min="1" defaultValue={p.price} required />
            <input className="field" name="validityDays" type="number" min="1" defaultValue={p.validityDays} required />
            <input className="field" name="deviceLimit" type="number" min="1" defaultValue={p.deviceLimit} required />
            <select className="field" name="dataType" defaultValue={p.dataType || "unlimited"}>
              <option value="unlimited">Unlimited</option>
              <option value="limited">Limited</option>
            </select>
            <input className="field" name="dataSizeGb" type="number" min="1" defaultValue={p.dataSizeGb || ""} placeholder="GB" />
            <input className="field md:col-span-2" name="description" defaultValue={p.description || ""} placeholder="Description" />
            <input className="field" name="badge" defaultValue={p.badge || ""} placeholder="Badge" />
            <select className="field" name="status" defaultValue={p.status || "active"}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <label className="flex items-center gap-2 text-sm font-semibold"><input name="includesTv" type="checkbox" defaultChecked={p.includesTv} /> TV access</label>
            <button className="btn btn-primary md:col-span-6">Save plan</button>
          </form>
        ))}
      </div>
    </>
  );
}

function WalletTopups({ rows, reload }: { rows: any[]; reload: () => void }) {
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  async function review(id: string, action: "confirm" | "reject") {
    setMessage(null);
    try {
      await sendJson(`/api/admin/wallet-topups/${id}/${action}`, { method: "PATCH" });
      setMessage({ type: "success", text: action === "confirm" ? "Top-up confirmed." : "Top-up rejected." });
      await reload();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Unable to review top-up." });
    }
  }
  return (
    <>
      {message ? <FormMessage type={message.type}>{message.text}</FormMessage> : null}
      <Table headers={["Customer", "Amount", "Reference", "Proof", "Status", "Date", "Actions"]}>
        {rows.map((t) => (
          <tr key={t.id}>
            <td>{t.customer?.fullName || "-"}<br /><span>{t.customer?.phone || t.customer?.email || "-"}</span></td>
            <td>{money(t.amount)}</td>
            <td>{t.bankTransferReference || "-"}</td>
            <td>{t.bankTransferProofUrl ? <a className="font-bold text-brand" href={t.bankTransferProofUrl} target="_blank">Open</a> : "-"}</td>
            <td>{t.status}</td>
            <td>{new Date(t.createdAt).toLocaleDateString()}</td>
            <td>
              {t.status === "awaiting_confirmation" ? <button className="btn btn-primary mr-2 px-3 py-2 text-xs" onClick={() => review(t.id, "confirm")}>Confirm</button> : null}
              {t.status === "awaiting_confirmation" ? <button className="btn btn-ghost px-3 py-2 text-xs" onClick={() => review(t.id, "reject")}>Reject</button> : null}
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}

function Settings({ bank, reload }: { bank?: any; reload: () => void }) {
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function save(formData: FormData) {
    setMessage(null);
    try {
      const response = await sendJson("/api/admin/settings/payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber: formData.get("accountNumber"),
          bankName: formData.get("bankName"),
          accountName: formData.get("accountName")
        })
      });
      setMessage({ type: response.demo ? "error" : "success", text: response.message || "Payment account updated." });
      await reload();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Unable to update payment account." });
    }
  }

  return (
    <div className="grid gap-5">
      {message ? <FormMessage type={message.type}>{message.text}</FormMessage> : null}
      <form action={save} className="card grid gap-3 p-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold">Account number<input className="field" name="accountNumber" defaultValue={bank?.accountNumber || ""} required /></label>
        <label className="grid gap-2 text-sm font-semibold">Bank name<input className="field" name="bankName" defaultValue={bank?.bankName || ""} required /></label>
        <label className="grid gap-2 text-sm font-semibold">Account name<input className="field" name="accountName" defaultValue={bank?.accountName || ""} required /></label>
        <button className="btn btn-primary md:col-span-3">Save payment account</button>
      </form>
    </div>
  );
}

function Support({ rows, reload }: { rows: any[]; reload: () => void }) {
  async function update(id: string, status: string) {
    await fetch(`/api/admin/support/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    reload();
  }
  return <Table headers={["Customer", "Hostel", "Issue", "Message", "Status", "Actions"]}>{rows.map((t) => <tr key={t.id}><td>{t.fullName}<br /><span>{t.phone}</span></td><td>{t.hostel?.name || "-"}</td><td>{t.issueType}</td><td>{t.message}</td><td>{t.status}</td><td><button className="btn btn-ghost mr-2 px-3 py-2 text-xs" onClick={() => update(t.id, "in_progress")}>In progress</button><button className="btn btn-primary px-3 py-2 text-xs" onClick={() => update(t.id, "resolved")}>Resolve</button><a className="ml-2 text-xs font-bold text-brand" href={whatsappLink(`Hello ${t.fullName}, support from Jendor The Plug.`)}>WhatsApp</a></td></tr>)}</Table>;
}

function Reports({ data }: { data: any }) {
  const sales = data.sales?.orders || [];
  const csv = useMemo(() => ["reference,customer,hostel,plan,amount,status", ...sales.map((o: any) => `${o.reference},${o.fullName},${o.hostel.name},${o.plan.name},${o.amount},${o.paymentStatus}`)].join("\n"), [sales]);
  return <div className="grid gap-5"><a className="btn btn-secondary w-fit" href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="jendor-sales.csv"><Download size={16} /> Export sales CSV</a><Table headers={["Report", "Value"]}><tr><td>Daily sales rows</td><td>{sales.length}</td></tr><tr><td>Sales by hostel</td><td>{data.hostelReports?.rows?.length || 0}</td></tr><tr><td>Sales by plan</td><td>{data.planReports?.rows?.length || 0}</td></tr><tr><td>Voucher status groups</td><td>{data.voucherReports?.rows?.length || 0}</td></tr><tr><td>Failed payments</td><td>{data.failed?.orders?.length || 0}</td></tr></Table></div>;
}

function Policies({ rows, reload }: { rows: any[]; reload: () => void }) {
  async function save(slug: string, formData: FormData) {
    await fetch(`/api/admin/policies/${slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: formData.get("title"), content: formData.get("content") }) });
    reload();
  }
  return <div className="grid gap-4">{rows.map((p) => <form key={p.id} action={save.bind(null, p.slug)} className="card grid gap-3 p-4"><input className="field font-bold" name="title" defaultValue={p.title} /><textarea className="field min-h-32" name="content" defaultValue={p.content} /><button className="btn btn-primary w-fit">Save policy</button></form>)}</div>;
}

function Customers({ rows }: { rows: any[] }) {
  return <Table headers={["Name", "Phone", "Email", "Wallet", "Orders", "Joined"]}>{rows.map((c) => <tr key={c.id}><td>{c.fullName}</td><td>{c.phone}</td><td>{c.email}</td><td>{money(c.walletBalance || 0)}</td><td>{c.orders.length}</td><td>{new Date(c.createdAt).toLocaleDateString()}</td></tr>)}</Table>;
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <div className="card overflow-x-auto"><table className="w-full border-collapse text-left text-sm"><thead><tr className="border-b border-line bg-slate-50">{headers.map((h) => <th key={h} className="whitespace-nowrap p-3 font-black text-slate-700">{h}</th>)}</tr></thead><tbody className="[&_td]:border-b [&_td]:border-line [&_td]:p-3 [&_span]:text-xs [&_span]:text-slate-500">{children}</tbody></table></div>;
}

function AdminForm({ action, fields, button }: { action: (formData: FormData) => void; fields: string[]; button: string }) {
  return <form action={action} className="card mb-5 grid gap-3 p-4 md:grid-cols-4">{fields.map((field) => <input key={field} className="field" name={field} placeholder={field} required={field === "name"} />)}<button className="btn btn-primary md:col-span-4">{button}</button></form>;
}

function FormMessage({ type, children }: { type: "error" | "success"; children: React.ReactNode }) {
  const styles = type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return <div className={`mb-4 rounded-lg border p-3 text-sm font-semibold ${styles}`}>{children}</div>;
}
