import type { Metadata } from "next";
import Link from "next/link";

import { LandingFooter } from "@/components/layout/LandingFooter";
import { getPublicReviews } from "@/lib/reviews/publicReviews";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Отзывы клиентов",
  description: "Реальные отзывы клиентов из Telegram и профилей на сайте.",
};

export default async function PublicReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ author?: string }>;
}) {
  const { author } = await searchParams;
  const reviews = await getPublicReviews();
  const authorFilter = author?.trim().toLowerCase();

  const filteredReviews = authorFilter
    ? reviews.filter((item) => {
        const username = item.authorUsername?.replace(/^@+/, "").toLowerCase() ?? "";
        const name = item.authorName.toLowerCase();
        return username === authorFilter || name === authorFilter;
      })
    : reviews;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex h-14 items-center border-b border-black/[0.06] px-6">
        <Link href="/" className="font-heading text-sm font-semibold text-gray-900 hover:text-[#10a37f]">
          GBT STORE
        </Link>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 md:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900">Отзывы клиентов</h1>
            <p className="mt-2 text-sm text-gray-500">
              Публикуем только реальные отзывы. Можно проверить источник и перейти в профиль.
            </p>
          </div>
          {authorFilter && (
            <Link href="/reviews" className="text-sm text-[#10a37f] hover:underline">
              Сбросить фильтр
            </Link>
          )}
        </div>

        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <article key={review.id} className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: review.avatarColor }}
                  >
                    {review.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{review.authorName}</p>
                      {review.rating && (
                        <span className="inline-flex text-base leading-none tracking-[0.24em] text-amber-400">
                          {"★".repeat(review.rating)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{review.dateLabel}</p>
                  </div>
                </div>
              </div>

              <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">{review.content}</p>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                {review.authorUsername && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                    @{review.authorUsername.replace(/^@+/, "")}
                  </span>
                )}
                {review.sourceUrl && (
                  <a
                    href={review.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#10a37f] hover:underline"
                  >
                    Открыть источник в Telegram
                  </a>
                )}
                <Link href={review.inSiteProfileUrl} className="text-gray-500 hover:text-gray-700 hover:underline">
                  Профиль на сайте
                </Link>
              </div>
            </article>
          ))}
        </div>

        {filteredReviews.length === 0 && (
          <div className="rounded-2xl border border-black/[0.07] bg-white p-6 text-center text-sm text-gray-500">
            По этому профилю пока нет опубликованных отзывов.
          </div>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}
