import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { STOREFRONT_CATALOGUE_TAG } from "@/lib/commerce/storefront-product";

/** Invalidate cached storefront catalogue after admin stock/price/product writes. */
export function revalidateStorefrontCatalogue() {
  revalidateTag(STOREFRONT_CATALOGUE_TAG, "max");
  revalidatePath("/");
  revalidatePath("/products/cotton-corduroy-dungarees/");
}
