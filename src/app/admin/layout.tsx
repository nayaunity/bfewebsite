import { requireAdmin } from "@/lib/admin";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";

export const metadata = {
  title: "Admin Dashboard | The Black Female Engineer",
  description: "Admin dashboard for managing jobs and links",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminHeader user={session.user} />
        <main className="py-6 px-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
