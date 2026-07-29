import { getStorefrontCatalogue } from "@/lib/commerce/storefront-product";
import { getCanonicalSiteUrl } from "@/lib/env";
import { getAbsoluteAssetUrl } from "@/lib/product";

export async function GET() {
  const catalogue = await getStorefrontCatalogue();
  const siteUrl = getCanonicalSiteUrl();

  const items = catalogue.variants.map((variant) => {
    const colour =
      catalogue.colours.find((colour) => colour.id === variant.colourId);
    const variantUrl = new URL(catalogue.path, siteUrl);
    variantUrl.searchParams.set("colour", colour?.slug ?? variant.colourId);
    variantUrl.searchParams.set("size", variant.sizeId);

    const availability =
      variant.available > 0 ? "in_stock" : "out_of_stock";

    const image =
      catalogue.images.gallery[0]
        ? getAbsoluteAssetUrl(catalogue.images.gallery[0])
        : "";

    return `  <item>
    <g:id>${escapeXml(variant.sku)}</g:id>
    <title>${escapeXml(`${catalogue.name} – ${variant.colourName} – ${variant.sizeName}`)}</title>
    <description>${escapeXml(catalogue.description)}</description>
    <link>${escapeXml(variantUrl.toString())}</link>
    <g:image_link>${escapeXml(image)}</g:image_link>
    <g:availability>${availability}</g:availability>
    <g:price>${variant.retailPrice.toFixed(2)} ${catalogue.currency}</g:price>
    <g:brand>${escapeXml(catalogue.brand)}</g:brand>
    <g:condition>new</g:condition>
    <g:item_group_id>${escapeXml(catalogue.productGroupId)}</g:item_group_id>
    <g:color>${escapeXml(variant.colourName)}</g:color>
    <g:size>${escapeXml(variant.sizeName)}</g:size>
    <g:material>${escapeXml(catalogue.material)}</g:material>
    <g:identifier_exists>false</g:identifier_exists>
  </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>${escapeXml(catalogue.brand)} Product Feed</title>
  <link>${siteUrl}</link>
  <description>Product feed for Google Merchant Center</description>
${items.join("\n")}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
