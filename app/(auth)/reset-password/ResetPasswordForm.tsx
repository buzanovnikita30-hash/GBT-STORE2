"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

export function ResetPasswordForm() {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(data: ResetPasswordInput) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/callback?type=recovery&returnUrl=/login?reset=success`,
    });
    if (error) { setServerError(error.message); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[#10a37f]/30 bg-[#10a37f]/5 px-5 py-6 text-center">
        <p className="font-semibold text-gray-900 mb-2">Письмо отправлено</p>
        <p className="text-sm text-gray-500">Проверьте почту и перейдите по ссылке для сброса пароля.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
        <input
          type="email"
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
      {serverError && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{serverError}</p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10a37f] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting && <Loader2 size={15} className="animate-spin" />}
        Отправить ссылку
      </button>
      <p className="text-center text-sm">
        <a href="/login" className="text-[#10a37f] hover:underline">← Вернуться к входу</a>
      </p>
    </form>
  );
}
