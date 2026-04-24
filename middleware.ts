import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { effectiveRoleFromProfile } from "@/lib/auth/superAdmin";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const protectedPaths = ["/dashboard", "/admin", "/checkout", "/support"];
  const isProtected = protectedPaths.some((p) => path.startsWith(p));
  const isAuthPage = path.startsWith("/login") || path.startsWith("/register");
  const canSwitchAccount = request.nextUrl.searchParams.get("switch") === "1";

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("returnUrl", path);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && user && !canSwitchAccount) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = effectiveRoleFromProfile(prof?.role ?? null, user.email);
    const isAdmin = role === "admin";
    const isOp = role === "operator";
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (isOp) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
