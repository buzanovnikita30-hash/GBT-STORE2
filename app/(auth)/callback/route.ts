import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { resolvePostLoginPath } from "@/lib/auth/postLoginPath";
import { syncProfileRoleForUser } from "@/lib/auth/syncProfileRole";
import type { Database } from "@/types/database";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const type = url.searchParams.get("type");
  const rawReturnUrl = url.searchParams.get("returnUrl") ?? "/dashboard";
  const returnUrl =
    rawReturnUrl.startsWith("/") && !rawReturnUrl.startsWith("//") ? rawReturnUrl : "/dashboard";

  if (type === "recovery") {
    const update = new URL("/reset-password/update", request.url);
    update.searchParams.set("returnUrl", returnUrl);
    let response = NextResponse.redirect(update);

    if (code) {
      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options);
              });
            },
          },
        }
      );
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        const login = new URL("/login", request.url);
        login.searchParams.set("error", "recovery");
        return NextResponse.redirect(login);
      }
    }

    return response;
  }

  const provisional = new URL(returnUrl, request.url);
  let response = NextResponse.redirect(provisional);

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const login = new URL("/login", request.url);
      login.searchParams.set("error", "callback");
      login.searchParams.set("returnUrl", returnUrl);
      return NextResponse.redirect(login);
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("error", "callback");
    login.searchParams.set("returnUrl", returnUrl);
    return NextResponse.redirect(login);
  }

  let role;
  try {
    role = await syncProfileRoleForUser(user.id, user.email ?? null);
  } catch {
    const login = new URL("/login", request.url);
    login.searchParams.set("error", "sync");
    login.searchParams.set("returnUrl", returnUrl);
    return NextResponse.redirect(login);
  }

  const path = resolvePostLoginPath(returnUrl, role);
  const finalUrl = new URL(path, request.url);

  if (finalUrl.pathname !== provisional.pathname || finalUrl.search !== provisional.search) {
    const nextResponse = NextResponse.redirect(finalUrl);
    copyCookies(response, nextResponse);
    return nextResponse;
  }

  return response;
}
