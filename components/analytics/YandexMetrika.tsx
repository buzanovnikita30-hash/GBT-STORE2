"use client";

import { useEffect } from "react";
import { useSafePathname } from "@/lib/client/useSafePathname";

declare global {
  interface Window {
    ym: (id: number, action: string, ...args: unknown[]) => void;
  }
}

const YM_ID = Number(process.env.NEXT_PUBLIC_YM_ID);

export function YandexMetrika() {
  const pathname = useSafePathname();

  useEffect(() => {
    if (!YM_ID) return;

    const script = document.createElement("script");
    script.src = "https://mc.yandex.ru/metrika/tag.js";
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.ym?.(YM_ID, "init", {
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: true,
      });
    };
  }, []);

  useEffect(() => {
    if (!YM_ID) return;
    window.ym?.(YM_ID, "hit", pathname);
  }, [pathname]);

  if (!YM_ID) return null;

  return (
    <noscript>
      <img
        src={`https://mc.yandex.ru/watch/${YM_ID}`}
        style={{ position: "absolute", left: "-9999px" }}
        alt=""
      />
    </noscript>
  );
}
