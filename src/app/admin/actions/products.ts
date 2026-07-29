"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/dal";
import {
  createProduct,
  updateProduct,
  addColourWithVariants,
  updateVariantStatus,
} from "@/lib/commerce/product-service";
import { ProductStatus, PublicationStatus, VariantStatus, FeedStatus } from "@/generated/prisma/client";

export type ProductActionState = {
  error?: string;
  ok?: boolean;
};

const createSchema = z.object({
  name: z.string().min(2),
  internalName: z.string().optional(),
  slug: z.string().optional(),
  styleCode: z.string().min(2).max(8),
  brand: z.string().optional(),
  productType: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  mainMaterial: z.string().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  publicationStatus: z.nativeEnum(PublicationStatus).optional(),
  colourName: z.string().optional(),
  colourCode: z.string().optional(),
  hexReference: z.string().optional(),
  retailPrice: z.coerce.number().min(0).optional(),
});

export async function createProductAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const user = await requireAdminSession("products:write");
  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    internalName: formData.get("internalName") || undefined,
    slug: formData.get("slug") || undefined,
    styleCode: formData.get("styleCode"),
    brand: formData.get("brand") || undefined,
    productType: formData.get("productType") || undefined,
    category: formData.get("category") || undefined,
    description: formData.get("description") || undefined,
    shortDescription: formData.get("shortDescription") || undefined,
    mainMaterial: formData.get("mainMaterial") || undefined,
    status: formData.get("status") || undefined,
    publicationStatus: formData.get("publicationStatus") || undefined,
    colourName: formData.get("colourName") || undefined,
    colourCode: formData.get("colourCode") || undefined,
    hexReference: formData.get("hexReference") || undefined,
    retailPrice: formData.get("retailPrice") || undefined,
  });

  if (!parsed.success) {
    return {
      error:
        "Check name, style code, and price. Style code must be 2–8 characters.",
    };
  }

  const sizeCodes = formData.getAll("sizeCodes").map(String);
  const sizes =
    sizeCodes.length > 0
      ? sizeCodes.map((code) => ({
          code,
          label: String(formData.get(`sizeLabel_${code}`) ?? code),
        }))
      : undefined;

  const stockBySize: Record<string, number> = {};
  for (const code of sizeCodes.length ? sizeCodes : ["XS", "S", "M", "L", "XL"]) {
    const raw = formData.get(`stock_${code}`);
    if (raw != null && String(raw) !== "") {
      stockBySize[code] = Math.max(0, Math.floor(Number(raw)));
    }
  }

  const hasLaunchColour =
    Boolean(parsed.data.colourName?.trim()) &&
    Boolean(parsed.data.colourCode?.trim()) &&
    parsed.data.retailPrice != null;

  try {
    const product = await createProduct({
      actorId: user.id,
      name: parsed.data.name,
      internalName: parsed.data.internalName,
      slug: parsed.data.slug,
      styleCode: parsed.data.styleCode,
      brand: parsed.data.brand,
      productType: parsed.data.productType,
      category: parsed.data.category,
      description: parsed.data.description,
      shortDescription: parsed.data.shortDescription,
      mainMaterial: parsed.data.mainMaterial,
      status: parsed.data.status,
      publicationStatus: parsed.data.publicationStatus,
      sizes,
      launchColour: hasLaunchColour
        ? {
            name: parsed.data.colourName!,
            code: parsed.data.colourCode!,
            hexReference: parsed.data.hexReference,
            retailPrice: parsed.data.retailPrice!,
            initialStockBySize: stockBySize,
            variantStatus: VariantStatus.DRAFT,
          }
        : undefined,
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    redirect(`/admin/products/${product.id}`);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return {
      error:
        error instanceof Error ? error.message : "Unable to create product.",
    };
  }
}

const updateSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  publicationStatus: z.nativeEnum(PublicationStatus).optional(),
  feedPublicationStatus: z.nativeEnum(FeedStatus).optional(),
  mainMaterial: z.string().optional(),
  fitSummary: z.string().optional(),
  careSummary: z.string().optional(),
  countryOfDesign: z.string().optional(),
  countryOfManufacture: z.string().optional(),
  seoTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  googleProductCategory: z.string().optional(),
});

export async function updateProductAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const user = await requireAdminSession("products:write");
  const parsed = updateSchema.safeParse({
    productId: formData.get("productId"),
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    shortDescription: formData.get("shortDescription") || undefined,
    status: formData.get("status") || undefined,
    publicationStatus: formData.get("publicationStatus") || undefined,
    feedPublicationStatus: formData.get("feedPublicationStatus") || undefined,
    mainMaterial: formData.get("mainMaterial") || undefined,
    fitSummary: formData.get("fitSummary") || undefined,
    careSummary: formData.get("careSummary") || undefined,
    countryOfDesign: formData.get("countryOfDesign") || undefined,
    countryOfManufacture: formData.get("countryOfManufacture") || undefined,
    seoTitle: formData.get("seoTitle") || undefined,
    metaDescription: formData.get("metaDescription") || undefined,
    googleProductCategory: formData.get("googleProductCategory") || undefined,
  });

  if (!parsed.success) {
    return { error: "Validation failed. Check the fields and try again." };
  }

  try {
    const { productId, ...fields } = parsed.data;
    await updateProduct({
      productId,
      actorId: user.id,
      ...fields,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to update product.",
    };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${parsed.data.productId}`);
  revalidatePath("/products", "layout");
  return { ok: true };
}

const addColourSchema = z.object({
  productId: z.string().min(1),
  colourName: z.string().min(1),
  colourCode: z.string().min(2).max(6),
  hexReference: z.string().optional(),
  retailPrice: z.coerce.number().min(0),
});

export async function addColourAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const user = await requireAdminSession("products:write");
  const parsed = addColourSchema.safeParse({
    productId: formData.get("productId"),
    colourName: formData.get("colourName"),
    colourCode: formData.get("colourCode"),
    hexReference: formData.get("hexReference") || undefined,
    retailPrice: formData.get("retailPrice"),
  });

  if (!parsed.success) {
    return { error: "Check colour name, code and price." };
  }

  const sizeKeys = formData.getAll("sizeCodes").map(String);
  if (sizeKeys.length === 0) {
    return { error: "Select at least one size." };
  }

  const stockBySize: Record<string, number> = {};
  for (const code of sizeKeys) {
    const raw = formData.get(`stock_${code}`);
    if (raw) stockBySize[code] = Math.max(0, Math.floor(Number(raw)));
  }

  try {
    await addColourWithVariants({
      productId: parsed.data.productId,
      actorId: user.id,
      colourName: parsed.data.colourName,
      colourCode: parsed.data.colourCode,
      hexReference: parsed.data.hexReference,
      sizeCodes: sizeKeys,
      retailPrice: parsed.data.retailPrice,
      variantStatus: VariantStatus.DRAFT,
      initialStockBySize: stockBySize,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to add colour.",
    };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${parsed.data.productId}`);
  revalidatePath("/admin/inventory");
  return { ok: true };
}

export async function updateVariantStatusAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const user = await requireAdminSession("products:write");
  const variantId = String(formData.get("variantId") ?? "");
  const status = String(formData.get("status") ?? "") as VariantStatus;

  if (!variantId || !Object.values(VariantStatus).includes(status)) {
    return { error: "Invalid variant or status." };
  }

  try {
    await updateVariantStatus({ variantId, status, actorId: user.id });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to update variant.",
    };
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/products", "layout");
  return { ok: true };
}
