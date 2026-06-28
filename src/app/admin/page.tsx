import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { AdminDashboard } from "./ui";

export default async function AdminPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return <AdminDashboard adminName={admin.name} />;
}
