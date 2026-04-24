"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback?returnUrl=/?verified=1`,
      },
    });
    if (error) {
      setServerError(error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[#10a37f]/30 bg-[#10a37f]/5 px-5 py-6 text-center">
        <p className="text-lg font-semibold text-gray-900 mb-2">Проверьте почту</p>
        <p className="text-sm text-gray-600">
          Мы отправили письмо с подтверждением. Перейдите по ссылке в письме, чтобы завершить регистрацию.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Пароль</label>
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            autoComplete="new-password"
            {...register("password")}
            className={cn(
              "w-full rounded-xl border px-3.5 py-2.5 pr-10 text-sm outline-none transition-shadow",
              "focus:ring-2 focus:ring-[#10a37f]/30 focus:border-[#10a37f]",
              errors.password ? "border-red-400" : "border-black/[0.12]"
            )}
            placeholder="Минимум 8 символов"
          />
          <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Повторите пароль</label>
        <input
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
          className={cn(
            "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-shadow",
            "focus:ring-2 focus:ring-[#10a37f]/30 focus:border-[#10a37f]",
            errors.confirmPassword ? "border-red-400" : "border-black/[0.12]"
          )}
          placeholder="••••••••"
        />
        {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
      </div>

      {serverError && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10a37f] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting && <Loader2 size={15} className="animate-spin" />}
        Зарегистрироваться
      </button>

      <p className="text-center text-xs text-gray-400">
        Нажимая «Зарегистрироваться», вы соглашаетесь с{" "}
        <a href="/terms" className="text-[#10a37f] hover:underline">офертой</a> и{" "}
        <a href="/privacy" className="text-[#10a37f] hover:underline">политикой конфиденциальности</a>.
      </p>
    </form>
  );
}
