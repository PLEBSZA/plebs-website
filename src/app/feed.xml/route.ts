import { connection } from "next/server";
import {
  buildMerchantFeedRss,
  buildMerchantFeedRows,
  createMerchantFeedHttpResult,
} from "@/lib/commerce/merchant-feed";
import { getStorefrontCatalogue } from "@/lib/commerce/storefront-product";
import { getCanonicalSiteUrl } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  await connection();
  const catalogue = await getStorefrontCatalogue();
  const result = createMerchantFeedHttpResult({ catalogue });

  if (result.status !== 200) {
    return new Response(result.body, {
      status: result.status,
      headers: {
        "Content-Type": result.contentType,
        "X-Robots-Tag": "noindex",
        "Cache-Control": "private, no-store",
      },
    });
  }

  const rows = buildMerchantFeedRows(catalogue);
  const xml = buildMerchantFeedRss(rows, getCanonicalSiteUrl());

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "X-Robots-Tag": "noindex",
      "Cache-Control": "private, no-store",
    },
  });
}
