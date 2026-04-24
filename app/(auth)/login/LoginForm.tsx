"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { normalizeEmailForAuth } from "@/lib/auth/normalizeEmail";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { resolvePostLoginPath } from "@/lib/auth/postLoginPath";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturnUrl = searchParams.get("returnUrl") ?? "/dashboard";
  const returnUrl =
    rawReturnUrl.startsWith("/") && !rawReturnUrl.startsWith("//")
      ? rawReturnUrl
      : "/dashboard";
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const authError = searchParams.get("error");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    const supabase = createClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: normalizeEmailForAuth(data.email),
      password: data.password,
    });
    if (error) {
      setServerError("Не удалось войти. Проверьте email/пароль или восстановите пароль.");
      return;
    }
    const accessToken = authData.session?.access_token;
    const syncRes = await fetch("/api/auth/sync-role", {
      method: "POST",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
    const syncBody = (await syncRes.json().catch(() => ({}))) as { role?: UserRole };
    const role: UserRole =
      syncBody.role === "admin" || syncBody.role === "operator" || syncBody.role === "client"
        ? syncBody.role
        : "client";
    const target = resolvePostLoginPath(returnUrl, role);
    router.push(target);
    router.refresh();
  }

  function onInvalid() {
    setServerError("Заполните email и пароль, затем попробуйте снова.");
  }

  useEffect(() => {
    const resetStatus = searchParams.get("reset");
    const verifiedStatus = searchParams.get("verified");

    if (resetStatus === "success") {
      setNotice("Пароль успешно обновлен. Теперь войдите с новым паролем.");
    } else if (verifiedStatus === "1") {
      setNotice("Email подтвержден. Теперь вы можете войти в кабинет.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authError) return;
    setServerError("Не удалось выполнить вход. Попробуйте еще раз.");
  }, [authError]);

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
        <input
          type="email"
          autoComplete="email"
          {...register("email")}
          className={cn(
            "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-shadow",
            "focus:ring-2 focus:ring-[#10a37f]/30 focus:border-[#10a37f]",
            errors.email ? "border-red-400" : "border-black/[0.12]"
          )}
          placeholder="you@example.com"
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700">Пароль</label>
          <a href="/reset-password" className="text-xs text-[#10a37f] hover:underline">Забыли пароль?</a>
        </div>
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            autoComplete="current-password"
            {...register("password")}
            className={cn(
              "w-full rounded-xl border px-3.5 py-2.5 pr-10 text-sm outline-none transition-shadow",
              "focus:ring-2 focus:ring-[#10a37f]/30 focus:border-[#10a37f]",
              errors.password ? "border-red-400" : "border-black/[0.12]"
            )}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
      </div>

      {serverError && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {serverError}
        </p>
      )}
      {notice && (
        <p className="rounded-lg border border-[#10a37f]/30 bg-[#10a37f]/10 px-3 py-2 text-sm text-[#0f766e]">
          {notice}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10a37f] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting && <Loader2 size={15} className="animate-spin" />}
        Войти
      </button>

    </form>
  );
}
