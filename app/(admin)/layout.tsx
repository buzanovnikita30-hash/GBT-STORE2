import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { resolveServerRole } from "@/lib/auth/server-role";
import {
  LayoutDashboard, ShoppingBag, MessageCircle,
  Star, Settings, Users, UserCircle, Percent, Tag,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Главная", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Заказы", icon: ShoppingBag },
  { href: "/admin/clients", label: "Клиенты", icon: UserCircle },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/chat", label: "Чат", icon: MessageCircle },
  { href: "/admin/promocodes", label: "Промокоды", icon: Tag },
  { href: "/admin/discounts", label: "Скидки", icon: Percent },
  { href: "/admin/reviews", label: "Отзывы", icon: Star },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = await resolveServerRole(user);
  if (!["admin", "operator"].includes(role)) {
    redirect("/dashboard");
  }
  const navItems = (role === "admin"
    ? NAV
    : NAV.filter((item) =>
        ["/admin", "/admin/orders", "/admin/chat", "/admin/clients"].includes(item.href)
      )
  );

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      <aside className="hidden w-52 flex-col border-r border-white/[0.07] md:flex">
        <div className="flex h-14 items-center border-b border-white/[0.07] px-4">
          <span className="font-heading text-sm font-semibold text-gray-200">
            GBT Admin
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-gray-100"
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/[0.07] p-2">
          <Link
            href="/login?switch=1"
            className="mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-500 hover:text-gray-300"
          >
            Сменить аккаунт
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-gray-500 hover:text-gray-300"
            >
              Выйти
            </button>
          </form>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-500 hover:text-gray-300"
          >
            На сайт →
          </Link>
        </div>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
