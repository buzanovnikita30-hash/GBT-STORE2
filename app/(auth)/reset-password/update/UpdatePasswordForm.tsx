"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { newPasswordSchema, type NewPasswordInput } from "@/lib/validations";

export function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
  });

  async function onSubmit(data: NewPasswordInput) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: data.password });

    if (error) {
      setServerError("Не удалось обновить пароль. Повторите попытку по ссылке из письма.");
      return;
    }

    await supabase.auth.signOut();
    const returnUrl = searchParams.get("returnUrl") ?? "/login?reset=success";
    router.replace(returnUrl);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Новый пароль</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            {...register("password")}
            className={cn(
              "w-full rounded-xl border px-3.5 py-2.5 pr-10 text-sm outline-none transition-shadow",
              "focus:border-[#10a37f] focus:ring-2 focus:ring-[#10a37f]/30",
              errors.password ? "border-red-400" : "border-black/[0.12]"
            )}
            placeholder="Минимум 8 символов"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Повторите пароль</label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            {...register("confirmPassword")}
            className={cn(
              "w-full rounded-xl border px-3.5 py-2.5 pr-10 text-sm outline-none transition-shadow",
              "focus:border-[#10a37f] focus:ring-2 focus:ring-[#10a37f]/30",
              errors.confirmPassword ? "border-red-400" : "border-black/[0.12]"
            )}
            placeholder="••••••••"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setShowConfirm((v) => !v)}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
      </div>

      {serverError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10a37f] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting && <Loader2 size={15} className="animate-spin" />}
        Сохранить новый пароль
      </button>
    </form>
  );
}
