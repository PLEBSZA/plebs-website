import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  FeedStatus,
  InventoryMovementReason,
  InventoryMovementType,
  PrismaClient,
  ProductStatus,
  PublicationStatus,
  VariantStatus,
} from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed PLEBS data.");
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const sizes = [
  { label: "XS", code: "XS", slug: "xs", displayOrder: 10 },
  { label: "S", code: "S", slug: "s", displayOrder: 20 },
  { label: "M", code: "M", slug: "m", displayOrder: 30 },
  { label: "L", code: "L", slug: "l", displayOrder: 40 },
  { label: "XL", code: "XL", slug: "xl", displayOrder: 50 },
] as const;

async function seed() {
  const product = await db.product.upsert({
    where: { slug: "cotton-corduroy-dungarees" },
    update: {
      name: "PLEBS 100% Cotton Corduroy Dungarees",
      styleCode: "D01",
      brand: "PLEBS",
      productType: "Dungarees",
      category: "Apparel",
      mainMaterial: "100% cotton corduroy",
      itemGroupId: "PLB-D01",
    },
    create: {
      name: "PLEBS 100% Cotton Corduroy Dungarees",
      internalName: "Corduroy Dungarees",
      slug: "cotton-corduroy-dungarees",
      styleCode: "D01",
      brand: "PLEBS",
      productType: "Dungarees",
      category: "Apparel",
      status: ProductStatus.ACTIVE,
      publicationStatus: PublicationStatus.STOREFRONT,
      mainMaterial: "100% cotton corduroy",
      itemGroupId: "PLB-D01",
      feedPublicationStatus: FeedStatus.PUBLISHED,
      identifierExists: false,
    },
  });

  const colourOption = await db.productOption.upsert({
    where: {
      productId_code: { productId: product.id, code: "COLOUR" },
    },
    update: { name: "Colour", displayOrder: 10 },
    create: {
      productId: product.id,
      name: "Colour",
      code: "COLOUR",
      displayOrder: 10,
    },
  });

  const sizeOption = await db.productOption.upsert({
    where: {
      productId_code: { productId: product.id, code: "SIZE" },
    },
    update: { name: "Size", displayOrder: 20 },
    create: {
      productId: product.id,
      name: "Size",
      code: "SIZE",
      displayOrder: 20,
    },
  });

  const forestGreen = await db.optionValue.upsert({
    where: {
      optionId_code: { optionId: colourOption.id, code: "FGR" },
    },
    update: {
      label: "Forest Green",
      slug: "forest-green",
      displayOrder: 10,
      isActive: true,
    },
    create: {
      optionId: colourOption.id,
      label: "Forest Green",
      code: "FGR",
      slug: "forest-green",
      displayOrder: 10,
      isActive: true,
    },
  });

  const sizeValues = new Map<string, string>();

  for (const size of sizes) {
    const value = await db.optionValue.upsert({
      where: {
        optionId_code: { optionId: sizeOption.id, code: size.code },
      },
      update: {
        label: size.label,
        slug: size.slug,
        displayOrder: size.displayOrder,
        sizeSystem: "Alpha",
        isActive: true,
      },
      create: {
        optionId: sizeOption.id,
        label: size.label,
        code: size.code,
        slug: size.slug,
        displayOrder: size.displayOrder,
        sizeSystem: "Alpha",
        isActive: true,
      },
    });
    sizeValues.set(size.code, value.id);
  }

  const location = await db.stockLocation.upsert({
    where: { code: "MAIN" },
    update: { name: "Main Stock", active: true },
    create: {
      name: "Main Stock",
      code: "MAIN",
      active: true,
      fulfilmentPriority: 10,
    },
  });

  for (const size of sizes) {
    const sizeValueId = sizeValues.get(size.code);
    if (!sizeValueId) throw new Error(`Missing size option value ${size.code}.`);

    const variant = await db.productVariant.upsert({
      where: {
        productId_colourValueId_sizeValueId: {
          productId: product.id,
          colourValueId: forestGreen.id,
          sizeValueId,
        },
      },
      update: {
        sku: `PLB-D01-FGR-${size.code}`,
        retailPrice: "799.99",
        currency: "ZAR",
        status: VariantStatus.ACTIVE,
      },
      create: {
        productId: product.id,
        colourValueId: forestGreen.id,
        sizeValueId,
        sku: `PLB-D01-FGR-${size.code}`,
        retailPrice: "799.99",
        currency: "ZAR",
        status: VariantStatus.ACTIVE,
        feedStatus: FeedStatus.PUBLISHED,
      },
    });

    const item = await db.inventoryItem.upsert({
      where: { variantId: variant.id },
      update: {},
      create: {
        variantId: variant.id,
        trackingEnabled: true,
        continueSellingOutOfStock: false,
      },
    });

    await db.inventoryLevel.upsert({
      where: {
        inventoryItemId_locationId: {
          inventoryItemId: item.id,
          locationId: location.id,
        },
      },
      update: {},
      create: {
        inventoryItemId: item.id,
        locationId: location.id,
        onHand: 0,
        reserved: 0,
        incoming: 0,
        lowStockThreshold: 3,
      },
    });

    if (size.code === "S") {
      const openingReference = "launch-forest-green-s";
      const existingOpening = await db.inventoryMovement.findFirst({
        where: {
          inventoryItemId: item.id,
          locationId: location.id,
          reasonCode: InventoryMovementReason.OPENING_BALANCE,
          referenceId: openingReference,
        },
      });

      if (!existingOpening) {
        await db.$transaction(async (transaction) => {
          const level = await transaction.inventoryLevel.findUniqueOrThrow({
            where: {
              inventoryItemId_locationId: {
                inventoryItemId: item.id,
                locationId: location.id,
              },
            },
          });

          if (level.onHand !== 0) {
            throw new Error(
              "Cannot seed the Size S opening balance because stock already exists.",
            );
          }

          await transaction.inventoryLevel.update({
            where: { id: level.id },
            data: { onHand: 10, version: { increment: 1 } },
          });
          await transaction.inventoryMovement.create({
            data: {
              inventoryItemId: item.id,
              locationId: location.id,
              quantityDelta: 10,
              quantityBefore: 0,
              quantityAfter: 10,
              movementType: InventoryMovementType.INCREASE,
              reasonCode: InventoryMovementReason.OPENING_BALANCE,
              referenceType: "seed",
              referenceId: openingReference,
              note: "Verified launch opening balance.",
            },
          });
        });
      }
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const { hash } = await import("bcryptjs");
    const { AdminRole } = await import("../src/generated/prisma/client");
    const passwordHash = await hash(adminPassword, 12);

    await db.user.upsert({
      where: { email: adminEmail },
      update: {
        name: process.env.ADMIN_NAME?.trim() || "PLEBS Owner",
        passwordHash,
        role: AdminRole.OWNER,
        active: true,
      },
      create: {
        email: adminEmail,
        name: process.env.ADMIN_NAME?.trim() || "PLEBS Owner",
        passwordHash,
        role: AdminRole.OWNER,
        active: true,
      },
    });
  } else {
    console.warn(
      "Skipping admin user seed. Set ADMIN_EMAIL and ADMIN_PASSWORD to create an owner account.",
    );
  }
}

seed()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
