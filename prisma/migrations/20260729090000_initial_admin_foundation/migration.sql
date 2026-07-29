-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('UNPUBLISHED', 'STOREFRONT', 'PRODUCT_FEED', 'STOREFRONT_AND_FEED');

-- CreateEnum
CREATE TYPE "VariantStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FeedStatus" AS ENUM ('UNPUBLISHED', 'PUBLISHED', 'EXCLUDED');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('INCREASE', 'DECREASE', 'RECOUNT');

-- CreateEnum
CREATE TYPE "InventoryMovementReason" AS ENUM ('OPENING_BALANCE', 'BATCH_RECEIPT', 'CUSTOMER_ORDER', 'ORDER_CANCELLATION', 'RETURN_ACCEPTED', 'EXCHANGE_RECEIVED', 'DAMAGED', 'SAMPLE_ALLOCATION', 'PHOTOSHOOT_ALLOCATION', 'STOCK_RECOUNT', 'MANUAL_CORRECTION', 'TRANSFER');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'CONVERTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('PLANNED', 'ORDERED', 'IN_PRODUCTION', 'PARTIALLY_RECEIVED', 'RECEIVED', 'QUALITY_HOLD', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QualityControlStatus" AS ENUM ('PENDING', 'PASSED', 'PARTIALLY_ACCEPTED', 'FAILED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORISED', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FulfilmentStatus" AS ENUM ('UNFULFILLED', 'PROCESSING', 'PACKED', 'FULFILLED', 'PARTIALLY_FULFILLED', 'DELIVERED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'AWAITING_RETURN', 'RECEIVED', 'INSPECTING', 'ACCEPTED', 'EXCHANGE_PENDING', 'EXCHANGE_SENT', 'REFUND_PENDING', 'REFUNDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReturnDisposition" AS ENUM ('SELLABLE_STOCK', 'QUARANTINE', 'DAMAGED', 'SAMPLE', 'DISCARD');

-- CreateEnum
CREATE TYPE "ExchangeStatus" AS ENUM ('REQUESTED', 'APPROVED', 'AWAITING_RETURN', 'RECEIVED', 'REPLACEMENT_PENDING', 'EXCHANGE_SENT', 'REFUNDED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RestockRequestStatus" AS ENUM ('ACTIVE', 'NOTIFIED', 'CONVERTED', 'EXPIRED', 'UNSUBSCRIBED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "MediaRole" AS ENUM ('PRIMARY', 'FRONT', 'BACK', 'SIDE', 'DETAIL', 'FABRIC_SWATCH', 'LIFESTYLE', 'SIZE_GUIDE', 'CARE_GUIDE', 'VIDEO');

-- CreateEnum
CREATE TYPE "MeasurementContext" AS ENUM ('BODY', 'FINISHED_GARMENT');

-- CreateEnum
CREATE TYPE "MeasurementMethod" AS ENUM ('LAID_FLAT', 'CIRCUMFERENCE', 'VERTICAL_LENGTH', 'ADJUSTABLE_RANGE');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'OPERATIONS_ADMIN', 'FULFILMENT_USER', 'CONTENT_EDITOR');

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "internal_name" TEXT,
    "slug" TEXT NOT NULL,
    "style_code" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "product_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "publication_status" "PublicationStatus" NOT NULL DEFAULT 'UNPUBLISHED',
    "description" TEXT,
    "short_description" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "main_material" TEXT,
    "fit_summary" TEXT,
    "care_summary" TEXT,
    "country_of_design" TEXT,
    "country_of_manufacture" TEXT,
    "seo_title" TEXT,
    "meta_description" TEXT,
    "canonical_override" TEXT,
    "open_graph_title" TEXT,
    "open_graph_description" TEXT,
    "open_graph_image" TEXT,
    "feed_title_override" TEXT,
    "feed_description_override" TEXT,
    "feed_publication_status" "FeedStatus" NOT NULL DEFAULT 'UNPUBLISHED',
    "google_product_category" TEXT,
    "item_group_id" TEXT NOT NULL,
    "identifier_exists" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_options" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "option_values" (
    "id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "hex_reference" TEXT,
    "swatch_image" TEXT,
    "supplier_colour_code" TEXT,
    "size_system" TEXT,
    "size_type" TEXT,
    "fit_notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "option_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "colour_value_id" TEXT NOT NULL,
    "size_value_id" TEXT NOT NULL,
    "retail_price" DECIMAL(12,2) NOT NULL,
    "compare_at_price" DECIMAL(12,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    "supplier_unit_cost" DECIMAL(12,2),
    "manufacturing_unit_cost" DECIMAL(12,2),
    "fabric_cost" DECIMAL(12,2),
    "hardware_cost" DECIMAL(12,2),
    "packaging_cost" DECIMAL(12,2),
    "inbound_freight" DECIMAL(12,2),
    "duty_cost" DECIMAL(12,2),
    "other_landed_cost" DECIMAL(12,2),
    "landed_cost" DECIMAL(12,2),
    "tax_included" BOOLEAN NOT NULL DEFAULT true,
    "weight" DECIMAL(10,3),
    "weight_unit" TEXT DEFAULT 'kg',
    "status" "VariantStatus" NOT NULL DEFAULT 'DRAFT',
    "feed_status" "FeedStatus" NOT NULL DEFAULT 'UNPUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_specifications" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "main_fabric_composition" TEXT,
    "secondary_fabric_composition" TEXT,
    "fabric_weight_gsm" INTEGER,
    "corduroy_wale" TEXT,
    "stretch_type" TEXT,
    "finish" TEXT,
    "lining" TEXT,
    "hardware_material" TEXT,
    "hardware_finish" TEXT,
    "closure_type" TEXT,
    "strap_type" TEXT,
    "pocket_count" INTEGER,
    "pocket_placement" TEXT,
    "reinforcement_details" TEXT,
    "supplier" TEXT,
    "manufacturer" TEXT,
    "sample_revision" TEXT,
    "production_revision" TEXT,
    "fit_type" TEXT,
    "intended_fit" TEXT,
    "leg_shape" TEXT,
    "rise" TEXT,
    "torso_length" TEXT,
    "bib_width" TEXT,
    "waist_shape" TEXT,
    "hip_ease" TEXT,
    "inseam" TEXT,
    "total_length" TEXT,
    "leg_opening" TEXT,
    "strap_adjustment_range" TEXT,
    "layering_allowance" TEXT,
    "model_sizing_notes" TEXT,
    "fit_guidance" TEXT,
    "size_up_guidance" TEXT,
    "size_down_guidance" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_specifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_measurements" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "size_value_id" TEXT NOT NULL,
    "measurement_type" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "context" "MeasurementContext" NOT NULL,
    "method" "MeasurementMethod" NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_information" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "maximum_wash_temperature" INTEGER,
    "wash_cycle" TEXT,
    "wash_inside_out" BOOLEAN,
    "wash_with_similar_colours" BOOLEAN,
    "bleach_instruction" TEXT,
    "tumble_dry_instruction" TEXT,
    "line_dry_instruction" TEXT,
    "ironing_instruction" TEXT,
    "dry_clean_instruction" TEXT,
    "expected_shrinkage" TEXT,
    "colour_transfer_warning" TEXT,
    "special_care_notes" TEXT,
    "care_label_version" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_media" (
    "id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt_text" TEXT,
    "is_decorative" BOOLEAN NOT NULL DEFAULT false,
    "role" "MediaRole" NOT NULL,
    "product_id" TEXT NOT NULL,
    "colour_value_id" TEXT,
    "variant_id" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "focal_point_x" DECIMAL(5,2),
    "focal_point_y" DECIMAL(5,2),
    "publication_status" "PublicationStatus" NOT NULL DEFAULT 'UNPUBLISHED',
    "uploaded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "tracking_enabled" BOOLEAN NOT NULL DEFAULT true,
    "continue_selling_out_of_stock" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "fulfilment_priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_levels" (
    "id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "on_hand" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "incoming" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 3,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_reservations" (
    "id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "cart_id" TEXT,
    "order_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMP(3),
    "converted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "quantity_delta" INTEGER NOT NULL,
    "quantity_before" INTEGER NOT NULL,
    "quantity_after" INTEGER NOT NULL,
    "movement_type" "InventoryMovementType" NOT NULL,
    "reason_code" "InventoryMovementReason" NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "note" TEXT,
    "administrator_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_batches" (
    "id" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'PLANNED',
    "supplier" TEXT,
    "manufacturer" TEXT,
    "purchase_order_reference" TEXT,
    "colour_or_fabric_lot" TEXT,
    "dye_lot_reference" TEXT,
    "production_date" DATE,
    "expected_delivery_date" DATE,
    "received_date" DATE,
    "freight_cost" DECIMAL(12,2),
    "other_allocated_cost" DECIMAL(12,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    "quality_control_status" "QualityControlStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_line_items" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "quantity_ordered" INTEGER NOT NULL DEFAULT 0,
    "quantity_received" INTEGER NOT NULL DEFAULT 0,
    "quantity_rejected" INTEGER NOT NULL DEFAULT 0,
    "quantity_accepted" INTEGER NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(12,2),
    "allocated_landed_cost" DECIMAL(12,2),
    "notes" TEXT,

    CONSTRAINT "batch_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "company" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "customer_id" TEXT,
    "customer_email" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT,
    "shipping_address" JSONB NOT NULL,
    "billing_address" JSONB NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "fulfilment_status" "FulfilmentStatus" NOT NULL DEFAULT 'UNFULFILLED',
    "status" "OrderStatus" NOT NULL DEFAULT 'OPEN',
    "currency" VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shipping_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "shipping_method" TEXT,
    "internal_notes" TEXT,
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT,
    "variant_id" TEXT,
    "product_name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "colour" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,
    "cost_snapshot" DECIMAL(12,2),

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_reference" TEXT,
    "provider_event_id" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfilments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "status" "FulfilmentStatus" NOT NULL DEFAULT 'UNFULFILLED',
    "courier" TEXT,
    "tracking_number" TEXT,
    "tracking_url" TEXT,
    "packed_by_id" TEXT,
    "fulfilled_by_id" TEXT,
    "packed_at" TIMESTAMP(3),
    "fulfilled_at" TIMESTAMP(3),
    "dispatched_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "customer_notified_at" TIMESTAMP(3),
    "internal_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fulfilments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "payment_id" TEXT,
    "provider_reference" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_requests" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "original_variant_id" TEXT,
    "reason" TEXT NOT NULL,
    "customer_comments" TEXT,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "return_tracking" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_at" TIMESTAMP(3),
    "inspection_outcome" TEXT,
    "disposition" "ReturnDisposition",
    "resolution" TEXT,
    "refund_reference" TEXT,
    "internal_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchanges" (
    "id" TEXT NOT NULL,
    "return_request_id" TEXT NOT NULL,
    "original_variant_id" TEXT,
    "replacement_variant_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price_difference" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "additional_payment" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "refund_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "replacement_reference" TEXT,
    "status" "ExchangeStatus" NOT NULL DEFAULT 'REQUESTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchanges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restock_requests" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "customer_id" TEXT,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "colour" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "status" "RestockRequestStatus" NOT NULL DEFAULT 'ACTIVE',
    "notified_at" TIMESTAMP(3),
    "notification_batch" TEXT,
    "converted_order_id" TEXT,
    "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
    "unsubscribed_at" TIMESTAMP(3),
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restock_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "password_hash" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'FULFILMENT_USER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "before_state" JSONB,
    "after_state" JSONB,
    "request_id" TEXT,
    "ip_address" TEXT,
    "session_metadata" JSONB,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_style_code_key" ON "products"("style_code");

-- CreateIndex
CREATE UNIQUE INDEX "products_item_group_id_key" ON "products"("item_group_id");

-- CreateIndex
CREATE INDEX "products_status_publication_status_idx" ON "products"("status", "publication_status");

-- CreateIndex
CREATE INDEX "product_options_product_id_display_order_idx" ON "product_options"("product_id", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "product_options_product_id_code_key" ON "product_options"("product_id", "code");

-- CreateIndex
CREATE INDEX "option_values_option_id_is_active_display_order_idx" ON "option_values"("option_id", "is_active", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "option_values_option_id_code_key" ON "option_values"("option_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "option_values_option_id_slug_key" ON "option_values"("option_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_barcode_key" ON "product_variants"("barcode");

-- CreateIndex
CREATE INDEX "product_variants_product_id_status_idx" ON "product_variants"("product_id", "status");

-- CreateIndex
CREATE INDEX "product_variants_colour_value_id_size_value_id_idx" ON "product_variants"("colour_value_id", "size_value_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_product_id_colour_value_id_size_value_id_key" ON "product_variants"("product_id", "colour_value_id", "size_value_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_specifications_product_id_key" ON "product_specifications"("product_id");

-- CreateIndex
CREATE INDEX "product_measurements_product_id_size_value_id_display_order_idx" ON "product_measurements"("product_id", "size_value_id", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "product_measurements_product_id_size_value_id_measurement_t_key" ON "product_measurements"("product_id", "size_value_id", "measurement_type", "context");

-- CreateIndex
CREATE UNIQUE INDEX "care_information_product_id_key" ON "care_information"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_media_storage_key_key" ON "product_media"("storage_key");

-- CreateIndex
CREATE INDEX "product_media_product_id_colour_value_id_variant_id_display_idx" ON "product_media"("product_id", "colour_value_id", "variant_id", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_variant_id_key" ON "inventory_items"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_locations_code_key" ON "stock_locations"("code");

-- CreateIndex
CREATE INDEX "stock_locations_active_fulfilment_priority_idx" ON "stock_locations"("active", "fulfilment_priority");

-- CreateIndex
CREATE INDEX "inventory_levels_location_id_on_hand_reserved_idx" ON "inventory_levels"("location_id", "on_hand", "reserved");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_levels_inventory_item_id_location_id_key" ON "inventory_levels"("inventory_item_id", "location_id");

-- CreateIndex
CREATE INDEX "inventory_reservations_inventory_item_id_location_id_status_idx" ON "inventory_reservations"("inventory_item_id", "location_id", "status", "expires_at");

-- CreateIndex
CREATE INDEX "inventory_reservations_cart_id_idx" ON "inventory_reservations"("cart_id");

-- CreateIndex
CREATE INDEX "inventory_reservations_order_id_idx" ON "inventory_reservations"("order_id");

-- CreateIndex
CREATE INDEX "inventory_movements_inventory_item_id_location_id_created_a_idx" ON "inventory_movements"("inventory_item_id", "location_id", "created_at");

-- CreateIndex
CREATE INDEX "inventory_movements_reference_type_reference_id_idx" ON "inventory_movements"("reference_type", "reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "production_batches_batch_number_key" ON "production_batches"("batch_number");

-- CreateIndex
CREATE INDEX "production_batches_status_expected_delivery_date_idx" ON "production_batches"("status", "expected_delivery_date");

-- CreateIndex
CREATE INDEX "batch_line_items_variant_id_idx" ON "batch_line_items"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "batch_line_items_batch_id_variant_id_key" ON "batch_line_items"("batch_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE INDEX "addresses_customer_id_idx" ON "addresses"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_number_key" ON "orders"("number");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "orders_customer_email_idx" ON "orders"("customer_email");

-- CreateIndex
CREATE INDEX "orders_payment_status_fulfilment_status_status_idx" ON "orders"("payment_status", "fulfilment_status", "status");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_sku_idx" ON "order_items"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_event_id_key" ON "payments"("provider_event_id");

-- CreateIndex
CREATE INDEX "payments_order_id_status_idx" ON "payments"("order_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_provider_reference_key" ON "payments"("provider", "provider_reference");

-- CreateIndex
CREATE INDEX "fulfilments_order_id_status_idx" ON "fulfilments"("order_id", "status");

-- CreateIndex
CREATE INDEX "fulfilments_tracking_number_idx" ON "fulfilments"("tracking_number");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_provider_reference_key" ON "refunds"("provider_reference");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_idempotency_key_key" ON "refunds"("idempotency_key");

-- CreateIndex
CREATE INDEX "refunds_order_id_idx" ON "refunds"("order_id");

-- CreateIndex
CREATE INDEX "return_requests_status_requested_at_idx" ON "return_requests"("status", "requested_at");

-- CreateIndex
CREATE INDEX "return_requests_order_id_idx" ON "return_requests"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "exchanges_return_request_id_key" ON "exchanges"("return_request_id");

-- CreateIndex
CREATE INDEX "exchanges_status_idx" ON "exchanges"("status");

-- CreateIndex
CREATE INDEX "restock_requests_variant_id_status_created_at_idx" ON "restock_requests"("variant_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "restock_requests_email_idx" ON "restock_requests"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_active_idx" ON "users"("role", "active");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "audit_events_entity_type_entity_id_created_at_idx" ON "audit_events"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_events_actor_id_created_at_idx" ON "audit_events"("actor_id", "created_at");

-- AddForeignKey
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_values" ADD CONSTRAINT "option_values_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "product_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_colour_value_id_fkey" FOREIGN KEY ("colour_value_id") REFERENCES "option_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_size_value_id_fkey" FOREIGN KEY ("size_value_id") REFERENCES "option_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_specifications" ADD CONSTRAINT "product_specifications_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_measurements" ADD CONSTRAINT "product_measurements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_measurements" ADD CONSTRAINT "product_measurements_size_value_id_fkey" FOREIGN KEY ("size_value_id") REFERENCES "option_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_information" ADD CONSTRAINT "care_information_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_colour_value_id_fkey" FOREIGN KEY ("colour_value_id") REFERENCES "option_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_levels" ADD CONSTRAINT "inventory_levels_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_levels" ADD CONSTRAINT "inventory_levels_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "stock_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "stock_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "stock_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_administrator_id_fkey" FOREIGN KEY ("administrator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_line_items" ADD CONSTRAINT "batch_line_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "production_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_line_items" ADD CONSTRAINT "batch_line_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfilments" ADD CONSTRAINT "fulfilments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfilments" ADD CONSTRAINT "fulfilments_packed_by_id_fkey" FOREIGN KEY ("packed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfilments" ADD CONSTRAINT "fulfilments_fulfilled_by_id_fkey" FOREIGN KEY ("fulfilled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_original_variant_id_fkey" FOREIGN KEY ("original_variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_return_request_id_fkey" FOREIGN KEY ("return_request_id") REFERENCES "return_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_original_variant_id_fkey" FOREIGN KEY ("original_variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_replacement_variant_id_fkey" FOREIGN KEY ("replacement_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restock_requests" ADD CONSTRAINT "restock_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restock_requests" ADD CONSTRAINT "restock_requests_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restock_requests" ADD CONSTRAINT "restock_requests_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restock_requests" ADD CONSTRAINT "restock_requests_converted_order_id_fkey" FOREIGN KEY ("converted_order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Domain invariants not expressible in the Prisma schema.
ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_nonnegative_money_check"
  CHECK (
    "retail_price" >= 0
    AND ("compare_at_price" IS NULL OR "compare_at_price" >= 0)
    AND ("supplier_unit_cost" IS NULL OR "supplier_unit_cost" >= 0)
    AND ("landed_cost" IS NULL OR "landed_cost" >= 0)
  ),
  ADD CONSTRAINT "product_variants_zar_currency_check"
  CHECK ("currency" = 'ZAR');

ALTER TABLE "product_measurements"
  ADD CONSTRAINT "product_measurements_positive_value_check"
  CHECK ("value" > 0);

ALTER TABLE "inventory_levels"
  ADD CONSTRAINT "inventory_levels_nonnegative_quantities_check"
  CHECK (
    "on_hand" >= 0
    AND "reserved" >= 0
    AND "incoming" >= 0
    AND "low_stock_threshold" >= 0
    AND "reserved" <= "on_hand"
  );

ALTER TABLE "inventory_reservations"
  ADD CONSTRAINT "inventory_reservations_positive_quantity_check"
  CHECK ("quantity" > 0);

ALTER TABLE "inventory_movements"
  ADD CONSTRAINT "inventory_movements_balanced_quantity_check"
  CHECK (
    "quantity_before" >= 0
    AND "quantity_after" >= 0
    AND "quantity_after" = "quantity_before" + "quantity_delta"
  );

ALTER TABLE "batch_line_items"
  ADD CONSTRAINT "batch_line_items_quantity_check"
  CHECK (
    "quantity_ordered" >= 0
    AND "quantity_received" >= 0
    AND "quantity_rejected" >= 0
    AND "quantity_accepted" >= 0
    AND "quantity_accepted" + "quantity_rejected" <= "quantity_received"
  );

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_nonnegative_totals_check"
  CHECK (
    "subtotal" >= 0
    AND "discount_total" >= 0
    AND "tax_total" >= 0
    AND "shipping_total" >= 0
    AND "total" >= 0
  ),
  ADD CONSTRAINT "orders_zar_currency_check"
  CHECK ("currency" = 'ZAR');

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_positive_quantity_check"
  CHECK ("quantity" > 0),
  ADD CONSTRAINT "order_items_nonnegative_money_check"
  CHECK (
    "unit_price" >= 0
    AND "discount" >= 0
    AND "tax" >= 0
    AND "line_total" >= 0
  );

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_nonnegative_amount_check"
  CHECK ("amount" >= 0),
  ADD CONSTRAINT "payments_zar_currency_check"
  CHECK ("currency" = 'ZAR');

ALTER TABLE "refunds"
  ADD CONSTRAINT "refunds_positive_amount_check"
  CHECK ("amount" > 0);

ALTER TABLE "exchanges"
  ADD CONSTRAINT "exchanges_positive_quantity_check"
  CHECK ("quantity" > 0);

-- A prior notification or expiry may be renewed; only one active request is allowed.
CREATE UNIQUE INDEX "restock_requests_active_email_variant_key"
  ON "restock_requests" (LOWER("email"), "variant_id")
  WHERE "status" = 'ACTIVE';
