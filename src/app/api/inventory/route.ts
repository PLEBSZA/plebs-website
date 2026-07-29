import { NextResponse } from "next/server";
import { getInventorySnapshot } from "@/lib/commerce/inventory-reservation";

export async function GET() {
  const variants = await getInventorySnapshot();
  return NextResponse.json({ variants });
}
