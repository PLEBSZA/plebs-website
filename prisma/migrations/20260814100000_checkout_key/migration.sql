-- Idempotent checkout sessions: one client checkoutKey maps to one pending order.

ALTER TABLE "orders" ADD COLUMN "checkout_key" TEXT;
CREATE UNIQUE INDEX "orders_checkout_key_key" ON "orders"("checkout_key");
