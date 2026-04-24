import { NextResponse } from "next/server";
import { getStoreConfig } from "@/lib/store-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const config = await getStoreConfig();
  return NextResponse.json(config, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
