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
          {tab === "Hostels" ? <Hostels rows={data.hostels?.hostels || []} plans={data.plans?.plans || []} reload={load} /> : null}
          {tab === "Plans" ? <Plans rows={data.plans?.plans || []} reload={load} /> : null}
          {tab === "Wallet" ? <WalletTopups rows={data.walletTopups?.topups || []} reload={load} /> : null}
          {tab === "Settings" ? <Settings bank={data.settings?.bank} reload={load} /> : null}
          {tab === "Support" ? <Support rows={data.tickets?.tickets || []} reload={load} /> : null}
          {tab === "Reports" ? <Reports data={data} reload={load} /> : null}
          {tab === "Policies" ? <Policies rows={data.policies?.policies || []} reload={load} /> : null}
          {tab === "Customers" ? <Customers rows={data.customers?.customers || []} hostels={data.hostels?.hostels || []} reload={load} /> : null}
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
      <Table headers={["Reference", "Customer", "Hostel", "Plan", "Amount", "Payment", "Receipt", "Voucher", "Actions"]}>
        {rows.map((o) => (
          <tr key={o.id}>
            <td>{o.reference}</td><td>{o.fullName}<br /><span>{o.phone}</span></td><td>{o.hostel.name}</td><td>{o.plan.name}</td><td>{money(o.amount)}</td><td>{o.paymentStatus}</td><td>{o.bankTransferProofUrl ? <a className="font-bold text-brand" href={o.bankTransferProofUrl} target="_blank">Open</a> : "-"}</td><td>{o.voucher?.code || "-"}</td>
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

function Hostels({ rows, plans, reload }: { rows: any[]; plans: any[]; reload: () => void }) {
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
      const planIds = formData.getAll("planIds") as string[];
      await sendJson(`/api/admin/hostels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(formData),
          planIds
        })
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
            <div className="md:col-span-5 border-t border-line pt-3 mt-1">
              <p className="text-sm font-bold text-slate-700 mb-2">Available Plans:</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {plans.map((plan) => {
                  const isChecked = h.planIds?.includes(plan.id);
                  return (
                    <label key={plan.id} className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="planIds" 
                        value={plan.id} 
                        defaultChecked={isChecked} 
                      />
                      {plan.name} ({money(plan.price)})
                    </label>
                  );
                })}
              </div>
            </div>
            <button className="btn btn-primary md:col-span-5">Save hostel</button>
          </form>
        ))}
      </div>
    </>
  );
}

function Plans({ rows, reload }: { rows: any[]; reload: () => void }) {
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [hostels, setHostels] = useState<any[]>([]);
  const [selectedHostelIds, setSelectedHostelIds] = useState<string[]>([]);

  // Load hostels for selection
  async function loadHostels() {
    try {
      const data = await getJson("/api/admin/hostels");
      setHostels(data.hostels || []);
    } catch (e) {
      console.error("Failed to load hostels", e);
    }
  }

  useEffect(() => {
    loadHostels();
  }, []);

  function toggleHostel(id: string) {
    setSelectedHostelIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }
  async function submit(formData: FormData) {
    const obj = Object.fromEntries(formData);
    setMessage(null);
    try {
      await sendJson("/api/admin/plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...obj, hostelIds: selectedHostelIds, includesTv: obj.includesTv === "on" }) });
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
        body: JSON.stringify({
          ...obj,
          hostelIds: selectedHostelIds,
          includesTv: obj.includesTv === "on"
        })
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

function BankSettings({ bank, reload }: { bank?: any; reload: () => void }) {
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
    <form action={save} className="card grid gap-3 p-4 md:grid-cols-3">
      <p className="font-black text-ink md:col-span-3">Payment Bank Details</p>
      {message ? <div className="md:col-span-3"><FormMessage type={message.type}>{message.text}</FormMessage></div> : null}
      <label className="grid gap-2 text-sm font-semibold">Account number<input className="field" name="accountNumber" defaultValue={bank?.accountNumber || ""} required /></label>
      <label className="grid gap-2 text-sm font-semibold">Bank name<input className="field" name="bankName" defaultValue={bank?.bankName || ""} required /></label>
      <label className="grid gap-2 text-sm font-semibold">Account name<input className="field" name="accountName" defaultValue={bank?.accountName || ""} required /></label>
      <button className="btn btn-primary md:col-span-3">Save payment account</button>
    </form>
  );
}

function PasswordSettings() {
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function save(formData: FormData) {
    setMessage(null);
    const currentPassword = String(formData.get("currentPassword") || "").trim();
    const newPassword = String(formData.get("newPassword") || "").trim();
    const confirmPassword = String(formData.get("confirmPassword") || "").trim();

    if (!currentPassword || !newPassword) {
      setMessage({ type: "error", text: "Current password and new password are required." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }

    try {
      const response = await sendJson("/api/admin/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      setMessage({ type: response.demo ? "error" : "success", text: response.message || "Password updated successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Unable to update password." });
    }
  }

  return (
    <form action={save} className="card grid gap-3 p-4 md:grid-cols-3">
      <p className="font-black text-ink md:col-span-3">Change Admin Password</p>
      {message ? <div className="md:col-span-3"><FormMessage type={message.type}>{message.text}</FormMessage></div> : null}
      <label className="grid gap-2 text-sm font-semibold">Current password<input className="field" name="currentPassword" type="password" required /></label>
      <label className="grid gap-2 text-sm font-semibold">New password<input className="field" name="newPassword" type="password" required /></label>
      <label className="grid gap-2 text-sm font-semibold">Confirm new password<input className="field" name="confirmPassword" type="password" required /></label>
      <button className="btn btn-primary md:col-span-3">Change password</button>
    </form>
  );
}

function SupportContactsSettings() {
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);

  async function loadContacts() {
    try {
      const res = await getJson("/api/admin/settings/support-contacts");
      setContacts(res.supportContacts || []);
    } catch (err) {
      console.error("Failed to load support contacts", err);
    }
  }

  useEffect(() => {
    loadContacts();
  }, []);

  async function addContact(formData: FormData) {
    setMessage(null);
    const name = String(formData.get("name")).trim();
    const phone = String(formData.get("phone")).trim();

    if (!name || !phone) return;

    const updated = [...contacts, { id: Date.now().toString(), name, phone }];
    try {
      await sendJson("/api/admin/settings/support-contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supportContacts: updated })
      });
      setMessage({ type: "success", text: "Contact added successfully." });
      setContacts(updated);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to add support contact." });
    }
  }

  async function deleteContact(id: string) {
    setMessage(null);
    const updated = contacts.filter((c) => c.id !== id);
    try {
      await sendJson("/api/admin/settings/support-contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supportContacts: updated })
      });
      setMessage({ type: "success", text: "Contact deleted successfully." });
      setContacts(updated);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to delete support contact." });
    }
  }

  return (
    <div className="card grid gap-3 p-4">
      <p className="font-black text-ink">WhatsApp Support Contacts</p>
      {message ? <FormMessage type={message.type}>{message.text}</FormMessage> : null}
      
      <form action={addContact} className="grid gap-3 sm:grid-cols-3 bg-slate-50 p-3 rounded border border-line">
        <input className="field py-1" name="name" placeholder="Contact Name" required />
        <input className="field py-1" name="phone" placeholder="WhatsApp Phone" required />
        <button className="btn btn-primary text-xs py-2">Add Contact</button>
      </form>

      <div className="mt-3 grid gap-2">
        {contacts.map((c) => (
          <div key={c.id} className="flex justify-between items-center bg-slate-100 p-2.5 rounded text-sm font-semibold text-slate-700">
            <div>
              <p>{c.name}</p>
              <p className="text-xs text-slate-500 font-normal">WhatsApp: {c.phone}</p>
            </div>
            <button type="button" className="btn btn-ghost px-2 py-1 text-xs text-red-600 hover:bg-red-50" onClick={() => deleteContact(c.id)}>Delete</button>
          </div>
        ))}
        {!contacts.length ? <p className="text-xs text-slate-400">No support contacts configured. System defaults will be used.</p> : null}
      </div>
    </div>
  );
}

function Settings({ bank, reload }: { bank?: any; reload: () => void }) {
  return (
    <div className="grid gap-5">
      <BankSettings bank={bank} reload={reload} />
      <SupportContactsSettings />
      <PasswordSettings />
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

function Reports({ data, reload }: { data: any; reload: () => void }) {
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const sales = data.sales?.orders || [];
  const csv = useMemo(() => ["reference,customer,hostel,plan,amount,status", ...sales.map((o: any) => `${o.reference},${o.fullName},${o.hostel.name},${o.plan.name},${o.amount},${o.paymentStatus}`)].join("\n"), [sales]);

  async function handleClearReports() {
    if (!window.confirm("ARE YOU ABSOLUTELY SURE? This will permanently delete all orders, vouchers, payments logs, and support complaints. This action can only be done once every 30 days and CANNOT be undone!")) {
      return;
    }
    setMessage(null);
    try {
      await sendJson("/api/admin/reports/clear", { method: "POST" });
      setMessage({ type: "success", text: "All reporting data cleared successfully." });
      reload();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to clear reports." });
    }
  }

  return (
    <div className="grid gap-5">
      {message ? <FormMessage type={message.type}>{message.text}</FormMessage> : null}
      <div className="flex gap-3">
        <a className="btn btn-secondary w-fit" href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="jendor-sales.csv"><Download size={16} /> Export sales CSV</a>
        <button className="btn btn-ghost border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 w-fit text-sm font-bold" onClick={handleClearReports}>
          Clear Reports (Once in 30 Days)
        </button>
      </div>
      <Table headers={["Report", "Value"]}>
        <tr><td>Daily sales rows</td><td>{sales.length}</td></tr>
        <tr><td>Sales by hostel</td><td>{data.hostelReports?.rows?.length || 0}</td></tr>
        <tr><td>Sales by plan</td><td>{data.planReports?.rows?.length || 0}</td></tr>
        <tr><td>Voucher status groups</td><td>{data.voucherReports?.rows?.length || 0}</td></tr>
        <tr><td>Failed payments</td><td>{data.failed?.orders?.length || 0}</td></tr>
      </Table>
    </div>
  );
}

function Policies({ rows, reload }: { rows: any[]; reload: () => void }) {
  async function save(slug: string, formData: FormData) {
    await fetch(`/api/admin/policies/${slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: formData.get("title"), content: formData.get("content") }) });
    reload();
  }
  return <div className="grid gap-4">{rows.map((p) => <form key={p.id} action={save.bind(null, p.slug)} className="card grid gap-3 p-4"><input className="field font-bold" name="title" defaultValue={p.title} /><textarea className="field min-h-32" name="content" defaultValue={p.content} /><button className="btn btn-primary w-fit">Save policy</button></form>)}</div>;
}

function Customers({ rows, hostels, reload }: { rows: any[]; hostels: any[]; reload: () => void }) {
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWallet, setEditWallet] = useState(0);
  const [editHostel, setEditHostel] = useState("");
  const [editPassword, setEditPassword] = useState("");

  function startEdit(c: any) {
    setEditId(c.id);
    setEditName(c.fullName);
    setEditPhone(c.phone);
    setEditEmail(c.email);
    setEditWallet(c.walletBalance || 0);
    setEditHostel(c.hostelId || "");
    setEditPassword("");
  }

  async function handleCreate(formData: FormData) {
    setMessage(null);
    try {
      const obj = Object.fromEntries(formData);
      await sendJson("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...obj,
          walletBalance: Number(obj.walletBalance || 0)
        })
      });
      setMessage({ type: "success", text: "Customer created." });
      reload();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to create customer." });
    }
  }

  async function handleUpdate(id: string, force = false) {
    setMessage(null);
    try {
      await sendJson(`/api/admin/customers/${id}${force ? "?force=true" : ""}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editName,
          phone: editPhone,
          email: editEmail,
          walletBalance: editWallet,
          hostelId: editHostel,
          password: editPassword
        })
      });
      setMessage({ type: "success", text: "Customer updated." });
      setEditId(null);
      reload();
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("recently") || msg.includes("30 days")) {
        if (window.confirm(`${msg}\n\nDo you want to FORCE update this customer's hostel?`)) {
          await handleUpdate(id, true);
          return;
        }
      } else {
        setMessage({ type: "error", text: msg || "Failed to update customer." });
      }
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return;
    setMessage(null);
    try {
      await sendJson(`/api/admin/customers/${id}`, { method: "DELETE" });
      setMessage({ type: "success", text: "Customer deleted." });
      reload();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to delete customer." });
    }
  }

  return (
    <div className="grid gap-5">
      {message ? <FormMessage type={message.type}>{message.text}</FormMessage> : null}
      
      {/* Create form */}
      <form action={handleCreate} className="card grid gap-3 p-4 md:grid-cols-6 bg-white shadow-soft">
        <p className="font-black text-ink md:col-span-6">Manually Create Customer</p>
        <input className="field" name="fullName" placeholder="Full name" required />
        <input className="field" name="phone" placeholder="Phone number" required />
        <input className="field" name="email" type="email" placeholder="Email address" required />
        <input className="field" name="password" type="password" placeholder="Password" required />
        <select className="field" name="hostelId" required>
          <option value="">Select Hostel</option>
          {hostels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        <input className="field" name="walletBalance" type="number" min="0" placeholder="Wallet balance (₦)" defaultValue="0" />
        <button className="btn btn-primary md:col-span-6">Create Customer</button>
      </form>

      <Table headers={["Name", "Hostel", "Wallet", "Phone", "Email", "Joined", "Actions"]}>
        {rows.map((c) => {
          const hostelName = hostels.find((h) => h.id === c.hostelId)?.name || "Not assigned";
          const isEditing = editId === c.id;
          const isExpanded = expandedId === c.id;

          return (
            <>
              <tr key={c.id}>
                {isEditing ? (
                  <>
                    <td><input className="field py-1" value={editName} onChange={(e) => setEditName(e.target.value)} /></td>
                    <td>
                      <select className="field py-1" value={editHostel} onChange={(e) => setEditHostel(e.target.value)}>
                        <option value="">Select Hostel</option>
                        {hostels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                    </td>
                    <td><input className="field py-1" type="number" value={editWallet} onChange={(e) => setEditWallet(Number(e.target.value))} /></td>
                    <td><input className="field py-1" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /></td>
                    <td><input className="field py-1" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} /></td>
                    <td>
                      <input className="field py-1" type="password" placeholder="New pass (opt)" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
                    </td>
                    <td className="min-w-40">
                      <button type="button" className="btn btn-primary mr-2 px-2 py-1 text-xs" onClick={() => handleUpdate(c.id)}>Save</button>
                      <button type="button" className="btn btn-ghost px-2 py-1 text-xs" onClick={() => setEditId(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="font-bold">{c.fullName}</td>
                    <td>{hostelName}</td>
                    <td>{money(c.walletBalance || 0)}</td>
                    <td>{c.phone}</td>
                    <td>{c.email}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="min-w-64">
                      <button type="button" className="btn btn-ghost mr-2 px-2 py-1 text-xs" onClick={() => startEdit(c)}>Edit</button>
                      <button type="button" className="btn btn-ghost mr-2 px-2 py-1 text-xs" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                        {isExpanded ? "Hide History" : "View History"}
                      </button>
                      <button type="button" className="btn btn-ghost px-2 py-1 text-xs text-red-600 hover:bg-red-50" onClick={() => handleDelete(c.id)}>Delete</button>
                    </td>
                  </>
                )}
              </tr>
              {isExpanded ? (
                <tr key={`${c.id}-expanded`}>
                  <td colSpan={7} className="bg-slate-50 p-4">
                    <p className="font-bold text-xs uppercase text-slate-500 mb-2">Wallet Transactions & Spending History</p>
                    {c.walletTransactions?.length ? (
                      <div className="overflow-x-auto max-h-60">
                        <table className="w-full text-left text-xs bg-white border border-line rounded">
                          <thead>
                            <tr className="bg-slate-100 border-b border-line">
                              <th className="p-2">Type</th>
                              <th className="p-2">Amount</th>
                              <th className="p-2">Status</th>
                              <th className="p-2">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {c.walletTransactions.map((tx: any) => (
                              <tr key={tx.id} className="border-b border-line last:border-0">
                                <td className="p-2 font-semibold">{tx.type}</td>
                                <td className="p-2">{money(tx.amount)}</td>
                                <td className="p-2">{tx.status}</td>
                                <td className="p-2">{new Date(tx.createdAt).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No transaction records found for this customer.</p>
                    )}
                  </td>
                </tr>
              ) : null}
            </>
          );
        })}
      </Table>
    </div>
  );
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
