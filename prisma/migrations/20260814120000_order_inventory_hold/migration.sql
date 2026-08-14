-- Paid orders that could not be re-reserved after expiry stay on an explicit
-- fulfilment hold until stock is recovered. Packing is blocked while this is true.

ALTER TABLE "orders" ADD COLUMN "inventory_hold" BOOLEAN NOT NULL DEFAULT false;
