import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      {/* Минималистичная шапка */}
      <header className="flex h-14 items-center border-b border-black/[0.08] bg-white/75 px-6 backdrop-blur-md">
        <Link
          href="/"
          className="font-heading text-sm font-semibold text-gray-900 hover:text-[#10a37f] transition-colors"
        >
          GBT STORE
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-black/[0.07] bg-white/78 p-5 shadow-[0_12px_36px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-6">
          {children}
        </div>
      </main>
      <footer className="py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} GBT STORE
      </footer>
    </div>
  );
}
