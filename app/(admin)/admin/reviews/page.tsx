import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { ReviewModerationActions } from "./ReviewModerationActions";
import { requireAdminPage } from "@/lib/auth/requireAdminPage";

export const metadata: Metadata = { title: "Admin · Отзывы" };

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam = "pending" } = await searchParams;
  const status =
    statusParam === "approved" || statusParam === "rejected" ? statusParam : "pending";
  await requireAdminPage();
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-gray-100">Отзывы</h1>
        <div className="flex gap-2">
          {["pending", "approved", "rejected"].map((s) => (
            <a
              key={s}
              href={`/admin/reviews?status=${s}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                status === s ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {s === "pending" ? "На модерации" : s === "approved" ? "Опубликованы" : "Отклонены"}
            </a>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {(reviews ?? []).map((review) => (
          <div key={review.id} className="rounded-xl border border-white/[0.07] bg-gray-900 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-200">
                  {review.author_name ?? "Аноним"}
                  {review.author_username && (
                    <span className="ml-2 text-xs text-gray-500">@{review.author_username}</span>
                  )}
                </p>
                <p className="mt-2 text-sm text-gray-300 leading-relaxed">{review.content}</p>
                {review.telegram_date && (
                  <p className="mt-1 text-xs text-gray-600">
                    {new Date(review.telegram_date).toLocaleDateString("ru")}
                  </p>
                )}
              </div>
              {status === "pending" && (
                <ReviewModerationActions reviewId={review.id} />
              )}
            </div>
          </div>
        ))}
        {(!reviews || reviews.length === 0) && (
          <p className="text-sm text-gray-500">В этом разделе пока нет отзывов</p>
        )}
      </div>
    </div>
  );
}
