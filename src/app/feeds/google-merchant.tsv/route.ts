import { connection } from "next/server";
import { NextResponse } from "next/server";
import { createMerchantFeedHttpResult } from "@/lib/commerce/merchant-feed";
import { getStorefrontCatalogue } from "@/lib/commerce/storefront-product";

async function merchantFeedResponse(method: "GET" | "HEAD"): Promise<NextResponse> {
  await connection();
  const catalogue = await getStorefrontCatalogue();
  const result = createMerchantFeedHttpResult({ catalogue });
  const headers = {
    "Content-Type": result.contentType,
    "X-Robots-Tag": "noindex",
    "Cache-Control": "private, no-store",
  };
  if (method === "HEAD") {
    return new NextResponse(null, { status: result.status, headers });
  }
  return new NextResponse(result.body, { status: result.status, headers });
}

export async function GET(): Promise<NextResponse> {
  return merchantFeedResponse("GET");
}

export async function HEAD(): Promise<NextResponse> {
  return merchantFeedResponse("HEAD");
}
