"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, LogOut, RefreshCw } from "lucide-react";
import { money, whatsappLink } from "@/lib/constants";

const tabs = ["Overview", "Orders", "Vouchers", "Hostels", "Plans", "Support", "Reports", "Policies", "Customers"];

async function getJson(path: string) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(path);
  return res.json();
}

export function AdminDashboard({ adminName }: { adminName: string }) {
  const [tab, setTab] = useState("Overview");
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [dashboard, orders, vouchers, hostels, plans, tickets, policies, customers, sales, hostelReports, planReports, voucherReports, failed] = await Promise.all([
        getJson("/api/admin/dashboard"),
        getJson("/api/admin/orders"),
        getJson("/api/admin/vouchers"),
        getJson("/api/admin/hostels"),
        getJson("/api/admin/plans"),
        getJson("/api/admin/support"),
        getJson("/api/admin/policies"),
        getJson("/api/admin/customers"),
        getJson("/api/admin/reports/sales"),
        getJson("/api/admin/reports/hostels"),
        getJson("/api/admin/reports/plans"),
        getJson("/api/admin/reports/vouchers"),
        getJson("/api/admin/reports/failed-payments")
      ]);
      setData({ dashboard, orders, vouchers, hostels, plans, tickets, policies, customers, sales, hostelReports, planReports, voucherReports, failed });
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
          {tab === "Overview" ? <Overview metrics={data.dashboard?.metrics} /> : null}
          {tab === "Orders" ? <Orders rows={data.orders?.orders || []} reload={load} /> : null}
          {tab === "Vouchers" ? <Vouchers rows={data.vouchers?.vouchers || []} reload={load} /> : null}
          {tab === "Hostels" ? <Hostels rows={data.hostels?.hostels || []} reload={load} /> : null}
          {tab === "Plans" ? <Plans rows={data.plans?.plans || []} reload={load} /> : null}
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
  async function action(path: string, method = "PATCH", body?: any) {
    await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    reload();
  }
  return (
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
  async function submit(formData: FormData) {
    await fetch("/api/admin/hostels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(formData)) });
    reload();
  }
  return <><AdminForm action={submit} fields={["name", "address", "wifiSsid", "supportPhone"]} button="Add hostel" /><Table headers={["Name", "Address", "SSID", "Support", "Status"]}>{rows.map((h) => <tr key={h.id}><td>{h.name}</td><td>{h.address}</td><td>{h.wifiSsid}</td><td>{h.supportPhone}</td><td>{h.status}</td></tr>)}</Table></>;
}

function Plans({ rows, reload }: { rows: any[]; reload: () => void }) {
  async function submit(formData: FormData) {
    const obj = Object.fromEntries(formData);
    await fetch("/api/admin/plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...obj, assignAllHostels: true, includesTv: obj.includesTv === "on" }) });
    reload();
  }
  return <><form action={submit} className="card mb-5 grid gap-3 p-4 md:grid-cols-4"><input className="field" name="name" placeholder="Plan name" required /><input className="field" name="price" type="number" placeholder="Price" required /><input className="field" name="validityDays" type="number" placeholder="Validity days" required /><input className="field" name="deviceLimit" type="number" placeholder="Devices" required /><select className="field" name="dataType"><option value="unlimited">Unlimited</option><option value="limited">Limited</option></select><input className="field" name="dataSizeGb" type="number" placeholder="GB optional" /><input className="field" name="badge" placeholder="Badge" /><label className="flex items-center gap-2 text-sm font-semibold"><input name="includesTv" type="checkbox" /> TV access</label><button className="btn btn-primary md:col-span-4">Add plan</button></form><Table headers={["Name", "Price", "Data", "Validity", "Devices", "TV", "Status"]}>{rows.map((p) => <tr key={p.id}><td>{p.name}</td><td>{money(p.price)}</td><td>{p.dataType === "limited" ? `${p.dataSizeGb}GB` : "Unlimited"}</td><td>{p.validityDays} days</td><td>{p.deviceLimit}</td><td>{p.includesTv ? "Yes" : "No"}</td><td>{p.status}</td></tr>)}</Table></>;
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
  return <Table headers={["Name", "Phone", "Email", "Orders", "Joined"]}>{rows.map((c) => <tr key={c.id}><td>{c.fullName}</td><td>{c.phone}</td><td>{c.email}</td><td>{c.orders.length}</td><td>{new Date(c.createdAt).toLocaleDateString()}</td></tr>)}</Table>;
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <div className="card overflow-x-auto"><table className="w-full border-collapse text-left text-sm"><thead><tr className="border-b border-line bg-slate-50">{headers.map((h) => <th key={h} className="whitespace-nowrap p-3 font-black text-slate-700">{h}</th>)}</tr></thead><tbody className="[&_td]:border-b [&_td]:border-line [&_td]:p-3 [&_span]:text-xs [&_span]:text-slate-500">{children}</tbody></table></div>;
}

function AdminForm({ action, fields, button }: { action: (formData: FormData) => void; fields: string[]; button: string }) {
  return <form action={action} className="card mb-5 grid gap-3 p-4 md:grid-cols-4">{fields.map((field) => <input key={field} className="field" name={field} placeholder={field} required={field === "name"} />)}<button className="btn btn-primary md:col-span-4">{button}</button></form>;
}
