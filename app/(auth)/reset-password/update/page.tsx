import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { UpdatePasswordForm } from "./UpdatePasswordForm";

export const metadata: Metadata = { title: "Новый пароль" };

export default function ResetPasswordUpdatePage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-2 font-heading text-2xl font-bold text-gray-900">Создайте новый пароль</h1>
      <p className="mb-8 text-sm text-gray-500">
        После сохранения пароля вы вернетесь на страницу входа.
      </p>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-8 text-[#10a37f]">
            <Loader2 size={18} className="animate-spin" />
          </div>
        }
      >
        <UpdatePasswordForm />
      </Suspense>
    </div>
  );
}
