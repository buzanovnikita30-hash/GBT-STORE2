"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resolvePostLoginPath } from "@/lib/auth/postLoginPath";
import { Loader2 } from "lucide-react";
import type { UserRole } from "@/types/database";

export function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    const type = searchParams.get("type");
    const code = searchParams.get("code");
    const rawReturnUrl = searchParams.get("returnUrl") ?? "/dashboard";
    const returnUrl =
      rawReturnUrl.startsWith("/") && !rawReturnUrl.startsWith("//")
        ? rawReturnUrl
        : "/dashboard";
    let cancelled = false;

    if (type === "recovery") {
      router.push(`/reset-password/update?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    const redirectToTarget = async () => {
      // Supabase can materialize a session with a slight delay after callback.
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const { data } = await supabase.auth.getSession();
        if (!cancelled && data.session) {
          const syncRes = await fetch("/api/auth/sync-role", {
            method: "POST",
            headers: { Authorization: `Bearer ${data.session.access_token}` },
          });
          const syncBody = (await syncRes.json().catch(() => ({}))) as { role?: UserRole };
          const role: UserRole =
            syncBody.role === "admin" || syncBody.role === "operator" || syncBody.role === "client"
              ? syncBody.role
              : "client";
          const target = resolvePostLoginPath(returnUrl, role);
          router.replace(target);
          router.refresh();
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      if (!cancelled) {
        router.replace(`/login?error=callback&returnUrl=${encodeURIComponent(returnUrl)}`);
      }
    };

    const finishAuth = async () => {
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
      await redirectToTarget();
    };

    void finishAuth();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Loader2 size={28} className="animate-spin text-[#10a37f]" />
      <p className="text-sm text-gray-500">Завершаем вход...</p>
    </div>
  );
}
