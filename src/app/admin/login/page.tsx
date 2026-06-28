import { AdminLoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="card w-full max-w-md p-6">
        <h1 className="text-2xl font-black text-ink">Admin login</h1>
        <p className="mt-2 text-sm text-slate-600">Manage vouchers, orders, support, reports, plans, and policies.</p>
        <AdminLoginForm />
      </div>
    </main>
  );
}
