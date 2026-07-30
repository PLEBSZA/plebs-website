-- PLEBS-ORDERS-002: ReturnRequest.reference + Exchange outbound tracking fields.
-- Two-step for reference so existing rows (if any) backfill before NOT NULL.

-- Step 1: add nullable reference column
ALTER TABLE "return_requests" ADD COLUMN "reference" TEXT;

-- Step 2: backfill from row id so values are unique and stable
-- Hand-added: seed from cuid id so the column can become NOT NULL safely.
UPDATE "return_requests"
SET "reference" = 'RMA-BACKFILL-' || UPPER(SUBSTRING("id" FROM 1 FOR 12))
WHERE "reference" IS NULL;

-- Step 3: enforce NOT NULL + unique
ALTER TABLE "return_requests" ALTER COLUMN "reference" SET NOT NULL;
CREATE UNIQUE INDEX "return_requests_reference_key" ON "return_requests"("reference");

-- Exchange outbound leg (mirrors Fulfilment tracking columns)
ALTER TABLE "exchanges" ADD COLUMN "courier" TEXT;
ALTER TABLE "exchanges" ADD COLUMN "tracking_number" TEXT;
ALTER TABLE "exchanges" ADD COLUMN "tracking_url" TEXT;
ALTER TABLE "exchanges" ADD COLUMN "dispatched_at" TIMESTAMP(3);
ALTER TABLE "exchanges" ADD COLUMN "delivered_at" TIMESTAMP(3);
ALTER TABLE "exchanges" ADD COLUMN "customer_notified_at" TIMESTAMP(3);

CREATE INDEX "exchanges_tracking_number_idx" ON "exchanges"("tracking_number");
