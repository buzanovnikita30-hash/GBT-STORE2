import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { DashboardNav, DashboardMobileNav } from "./DashboardNav";
import { resolveServerRole } from "@/lib/auth/server-role";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?returnUrl=/dashboard");
  }

  const role = await resolveServerRole(user);
  if (role === "admin" || role === "operator") {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Dark Sidebar */}
      <aside className="hidden w-60 flex-col bg-[#111827] md:flex">
        <div className="border-b border-white/10 px-4 py-5">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#10a37f] text-sm font-bold text-white">G</div>
            <span className="font-heading text-sm font-bold text-white">GBT STORE</span>
          </Link>
        </div>

        <DashboardNav />

        <div className="border-t border-white/10 px-3 py-3">
          <div className="mb-3 flex items-center gap-2.5 px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10a37f] text-xs font-bold text-white">
              {user.email?.[0]?.toUpperCase()}
            </div>
            <p className="truncate text-xs text-gray-400">{user.email}</p>
          </div>
          <Link
            href="/login?switch=1"
            className="mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            Сменить аккаунт
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
            >
              <LogOut size={15} />
              Выйти
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
          <Link href="/" className="font-heading text-sm font-semibold text-gray-900">GBT STORE</Link>
          <DashboardMobileNav />
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
