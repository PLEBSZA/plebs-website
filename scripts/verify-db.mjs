import "dotenv/config";

import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const ping = await client.query("SELECT 1 AS ok");
console.log("connection_ok=" + ping.rows[0].ok);

const products = await client.query("SELECT COUNT(*)::int AS count FROM products");
const variants = await client.query(
  "SELECT COUNT(*)::int AS count FROM product_variants",
);
const sizeS = await client.query(
  `SELECT il.on_hand
   FROM inventory_levels il
   JOIN inventory_items ii ON ii.id = il.inventory_item_id
   JOIN product_variants pv ON pv.id = ii.variant_id
   WHERE pv.sku = $1`,
  ["PLB-D01-FGR-S"],
);

console.log("products=" + products.rows[0].count);
console.log("variants=" + variants.rows[0].count);
console.log("size_s_on_hand=" + (sizeS.rows[0]?.on_hand ?? "missing"));

await client.end();
