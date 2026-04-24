"use client";

import { useEffect, useState } from "react";

function readPathname() {
  if (typeof window === "undefined") return "/";
  return window.location.pathname || "/";
}

/**
 * Safe pathname hook that does not depend on next/navigation context.
 * Helps avoid runtime crashes when router context is temporarily unavailable.
 */
export function useSafePathname() {
  const [pathname, setPathname] = useState<string>(readPathname);

  useEffect(() => {
    const update = () => setPathname(readPathname());

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      window.dispatchEvent(new Event("locationchange"));
      return result;
    };

    window.history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event("locationchange"));
      return result;
    };

    window.addEventListener("popstate", update);
    window.addEventListener("locationchange", update);
    update();

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", update);
      window.removeEventListener("locationchange", update);
    };
  }, []);

  return pathname;
}
