import "server-only";

import {
  FeedStatus,
  InventoryMovementReason,
  InventoryMovementType,
  ProductStatus,
  PublicationStatus,
  VariantStatus,
} from "@/generated/prisma/client";
import { recordAuditEvent } from "@/lib/admin/audit";
import { db } from "@/lib/db";
import { buildSku } from "@/lib/commerce/sku";

const DEFAULT_SIZES = [
  { label: "XS", code: "XS", slug: "xs", displayOrder: 10 },
  { label: "S", code: "S", slug: "s", displayOrder: 20 },
  { label: "M", code: "M", slug: "m", displayOrder: 30 },
  { label: "L", code: "L", slug: "l", displayOrder: 40 },
  { label: "XL", code: "XL", slug: "xl", displayOrder: 50 },
] as const;

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createProduct(input: {
  actorId: string;
  name: string;
  internalName?: string;
  slug?: string;
  styleCode: string;
  brand?: string;
  productType?: string;
  category?: string;
  description?: string;
  shortDescription?: string;
  mainMaterial?: string;
  fitSummary?: string;
  careSummary?: string;
  countryOfDesign?: string;
  countryOfManufacture?: string;
  status?: ProductStatus;
  publicationStatus?: PublicationStatus;
  sizes?: Array<{ label: string; code: string }>;
  launchColour?: {
    name: string;
    code: string;
    hexReference?: string;
    retailPrice: number;
    initialStockBySize?: Record<string, number>;
    variantStatus?: VariantStatus;
  };
}) {
  const name = input.name.trim();
  const styleCode = input.styleCode.trim().toUpperCase();
  if (!name) throw new Error("Product name is required.");
  if (!/^[A-Z0-9]{2,8}$/.test(styleCode)) {
    throw new Error(
      "Style code must be 2–8 letters/numbers (e.g. D01, DNM01).",
    );
  }

  const slug = slugify(input.slug?.trim() || name);
  if (!slug) throw new Error("A valid URL slug is required.");

  const brand = (input.brand ?? "PLEBS").trim() || "PLEBS";
  const productType = (input.productType ?? "Dungarees").trim() || "Dungarees";
  const category = (input.category ?? "Apparel").trim() || "Apparel";
  const itemGroupId = `PLB-${styleCode}`;

  const sizes =
    input.sizes && input.sizes.length > 0
      ? input.sizes.map((size, index) => {
          const code = size.code.trim().toUpperCase();
          const label = size.label.trim() || code;
          if (!code) throw new Error("Each size needs a code.");
          return {
            label,
            code,
            slug: slugify(label) || code.toLowerCase(),
            displayOrder: (index + 1) * 10,
          };
        })
      : [...DEFAULT_SIZES];

  const product = await db.$transaction(async (tx) => {
    const existingSlug = await tx.product.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new Error(`A product with slug "${slug}" already exists.`);
    }

    const existingStyle = await tx.product.findUnique({
      where: { styleCode },
    });
    if (existingStyle) {
      throw new Error(`Style code ${styleCode} is already in use.`);
    }

    const existingGroup = await tx.product.findUnique({
      where: { itemGroupId },
    });
    if (existingGroup) {
      throw new Error(`Item group ${itemGroupId} already exists.`);
    }

    const created = await tx.product.create({
      data: {
        name,
        internalName: input.internalName?.trim() || null,
        slug,
        styleCode,
        brand,
        productType,
        category,
        status: input.status ?? ProductStatus.DRAFT,
        publicationStatus:
          input.publicationStatus ?? PublicationStatus.UNPUBLISHED,
        description: input.description?.trim() || null,
        shortDescription: input.shortDescription?.trim() || null,
        mainMaterial: input.mainMaterial?.trim() || null,
        fitSummary: input.fitSummary?.trim() || null,
        careSummary: input.careSummary?.trim() || null,
        countryOfDesign: input.countryOfDesign?.trim() || null,
        countryOfManufacture: input.countryOfManufacture?.trim() || null,
        itemGroupId,
        feedPublicationStatus: FeedStatus.UNPUBLISHED,
        identifierExists: false,
      },
    });

    const colourOption = await tx.productOption.create({
      data: {
        productId: created.id,
        name: "Colour",
        code: "COLOUR",
        displayOrder: 10,
      },
    });

    const sizeOption = await tx.productOption.create({
      data: {
        productId: created.id,
        name: "Size",
        code: "SIZE",
        displayOrder: 20,
      },
    });

    for (const size of sizes) {
      await tx.optionValue.create({
        data: {
          optionId: sizeOption.id,
          label: size.label,
          code: size.code,
          slug: size.slug,
          displayOrder: size.displayOrder,
          sizeSystem: "Alpha",
          isActive: true,
        },
      });
    }

    return { product: created, colourOptionId: colourOption.id };
  });

  if (input.launchColour) {
    await addColourWithVariants({
      productId: product.product.id,
      actorId: input.actorId,
      colourName: input.launchColour.name,
      colourCode: input.launchColour.code,
      hexReference: input.launchColour.hexReference,
      sizeCodes: sizes.map((size) => size.code),
      retailPrice: input.launchColour.retailPrice,
      variantStatus:
        input.launchColour.variantStatus ?? VariantStatus.DRAFT,
      initialStockBySize: input.launchColour.initialStockBySize,
    });
  }

  await recordAuditEvent({
    actorId: input.actorId,
    action: "product.created",
    entityType: "product",
    entityId: product.product.id,
    afterState: {
      name: product.product.name,
      slug: product.product.slug,
      styleCode: product.product.styleCode,
      itemGroupId: product.product.itemGroupId,
      sizes: sizes.map((size) => size.code),
      launchColour: input.launchColour?.code ?? null,
    },
  });

  return product.product;
}

export async function getProductForAdmin(id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      specification: true,
      careInformation: true,
      options: {
        include: {
          values: { orderBy: { displayOrder: "asc" } },
        },
        orderBy: { displayOrder: "asc" },
      },
      variants: {
        include: {
          colourValue: true,
          sizeValue: true,
          inventoryItem: {
            include: {
              levels: {
                orderBy: { location: { fulfilmentPriority: "desc" } },
                take: 1,
              },
            },
          },
        },
        orderBy: [
          { colourValue: { displayOrder: "asc" } },
          { sizeValue: { displayOrder: "asc" } },
        ],
      },
    },
  });
}

export async function updateProduct(input: {
  productId: string;
  actorId: string;
  name?: string;
  internalName?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  status?: ProductStatus;
  publicationStatus?: PublicationStatus;
  mainMaterial?: string | null;
  fitSummary?: string | null;
  careSummary?: string | null;
  countryOfDesign?: string | null;
  countryOfManufacture?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  openGraphTitle?: string | null;
  openGraphDescription?: string | null;
  feedTitleOverride?: string | null;
  feedDescriptionOverride?: string | null;
  feedPublicationStatus?: FeedStatus;
  googleProductCategory?: string | null;
  specification?: Record<string, string | number | boolean | null>;
  care?: Record<string, string | number | boolean | null>;
}) {
  const before = await db.product.findUniqueOrThrow({
    where: { id: input.productId },
  });

  const product = await db.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: input.productId },
      data: {
        name: input.name,
        internalName: input.internalName,
        description: input.description,
        shortDescription: input.shortDescription,
        status: input.status,
        publicationStatus: input.publicationStatus,
        mainMaterial: input.mainMaterial,
        fitSummary: input.fitSummary,
        careSummary: input.careSummary,
        countryOfDesign: input.countryOfDesign,
        countryOfManufacture: input.countryOfManufacture,
        seoTitle: input.seoTitle,
        metaDescription: input.metaDescription,
        openGraphTitle: input.openGraphTitle,
        openGraphDescription: input.openGraphDescription,
        feedTitleOverride: input.feedTitleOverride,
        feedDescriptionOverride: input.feedDescriptionOverride,
        feedPublicationStatus: input.feedPublicationStatus,
        googleProductCategory: input.googleProductCategory,
        archivedAt:
          input.status === ProductStatus.ARCHIVED ? new Date() : null,
      },
    });

    if (input.specification) {
      await tx.productSpecification.upsert({
        where: { productId: input.productId },
        update: input.specification,
        create: {
          productId: input.productId,
          ...input.specification,
        },
      });
    }

    if (input.care) {
      await tx.careInformation.upsert({
        where: { productId: input.productId },
        update: input.care,
        create: {
          productId: input.productId,
          ...input.care,
        },
      });
    }

    return updated;
  });

  await recordAuditEvent({
    actorId: input.actorId,
    action: "product.updated",
    entityType: "product",
    entityId: product.id,
    beforeState: {
      status: before.status,
      publicationStatus: before.publicationStatus,
      name: before.name,
    },
    afterState: {
      status: product.status,
      publicationStatus: product.publicationStatus,
      name: product.name,
    },
  });

  return product;
}

export async function addColourWithVariants(input: {
  productId: string;
  actorId: string;
  colourName: string;
  colourCode: string;
  hexReference?: string;
  sizeCodes: string[];
  retailPrice: number;
  landedCost?: number;
  variantStatus?: VariantStatus;
  initialStockBySize?: Record<string, number>;
}) {
  const colourName = input.colourName.trim();
  const colourCode = input.colourCode.trim().toUpperCase();
  if (!colourName || !colourCode) {
    throw new Error("Colour name and code are required.");
  }
  if (input.sizeCodes.length === 0) {
    throw new Error("Select at least one size.");
  }
  if (input.retailPrice < 0) {
    throw new Error("Retail price cannot be negative.");
  }

  return db.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({
      where: { id: input.productId },
    });

    const colourOption = await tx.productOption.findUniqueOrThrow({
      where: {
        productId_code: { productId: product.id, code: "COLOUR" },
      },
    });
    const sizeOption = await tx.productOption.findUniqueOrThrow({
      where: {
        productId_code: { productId: product.id, code: "SIZE" },
      },
    });

    const existingColour = await tx.optionValue.findUnique({
      where: {
        optionId_code: { optionId: colourOption.id, code: colourCode },
      },
    });
    if (existingColour) {
      throw new Error(`Colour code ${colourCode} already exists on this product.`);
    }

    const sizeValues = await tx.optionValue.findMany({
      where: {
        optionId: sizeOption.id,
        code: { in: input.sizeCodes.map((code) => code.toUpperCase()) },
      },
      orderBy: { displayOrder: "asc" },
    });

    if (sizeValues.length !== input.sizeCodes.length) {
      throw new Error("One or more selected sizes were not found.");
    }

    const maxOrder = await tx.optionValue.aggregate({
      where: { optionId: colourOption.id },
      _max: { displayOrder: true },
    });

    const colourValue = await tx.optionValue.create({
      data: {
        optionId: colourOption.id,
        label: colourName,
        code: colourCode,
        slug: colourName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        displayOrder: (maxOrder._max.displayOrder ?? 0) + 10,
        hexReference: input.hexReference?.trim() || null,
        isActive: true,
      },
    });

    const location = await tx.stockLocation.findUniqueOrThrow({
      where: { code: "MAIN" },
    });

    const createdVariants = [];

    for (const size of sizeValues) {
      const sku = buildSku({
        styleCode: product.styleCode,
        colourCode,
        sizeCode: size.code,
      });

      const variant = await tx.productVariant.create({
        data: {
          productId: product.id,
          colourValueId: colourValue.id,
          sizeValueId: size.id,
          sku,
          retailPrice: input.retailPrice.toFixed(2),
          landedCost:
            input.landedCost != null ? input.landedCost.toFixed(2) : null,
          currency: "ZAR",
          status: input.variantStatus ?? VariantStatus.DRAFT,
          feedStatus: FeedStatus.UNPUBLISHED,
        },
      });

      const item = await tx.inventoryItem.create({
        data: {
          variantId: variant.id,
          trackingEnabled: true,
          continueSellingOutOfStock: false,
        },
      });

      const opening = Math.max(
        0,
        Math.floor(input.initialStockBySize?.[size.code] ?? 0),
      );

      await tx.inventoryLevel.create({
        data: {
          inventoryItemId: item.id,
          locationId: location.id,
          onHand: opening,
          reserved: 0,
          incoming: 0,
          lowStockThreshold: 3,
        },
      });

      if (opening > 0) {
        await tx.inventoryMovement.create({
          data: {
            inventoryItemId: item.id,
            locationId: location.id,
            quantityDelta: opening,
            quantityBefore: 0,
            quantityAfter: opening,
            movementType: InventoryMovementType.INCREASE,
            reasonCode: InventoryMovementReason.OPENING_BALANCE,
            referenceType: "colour_creation",
            referenceId: colourValue.id,
            administratorId: input.actorId,
            note: `Opening balance for ${sku}`,
          },
        });
      }

      createdVariants.push(variant);
    }

    await recordAuditEvent({
      actorId: input.actorId,
      action: "product.colour_added",
      entityType: "product",
      entityId: product.id,
      afterState: {
        colour: colourName,
        colourCode,
        variants: createdVariants.map((variant) => variant.sku),
      },
    });

    return { colourValue, variants: createdVariants };
  });
}

export async function updateVariantStatus(input: {
  variantId: string;
  status: VariantStatus;
  actorId: string;
}) {
  const before = await db.productVariant.findUniqueOrThrow({
    where: { id: input.variantId },
  });

  const variant = await db.productVariant.update({
    where: { id: input.variantId },
    data: {
      status: input.status,
      archivedAt:
        input.status === VariantStatus.ARCHIVED ? new Date() : null,
    },
  });

  await recordAuditEvent({
    actorId: input.actorId,
    action: "variant.status_changed",
    entityType: "product_variant",
    entityId: variant.id,
    beforeState: { status: before.status, sku: before.sku },
    afterState: { status: variant.status, sku: variant.sku },
  });

  return variant;
}

export { ProductStatus, PublicationStatus, VariantStatus, FeedStatus };
