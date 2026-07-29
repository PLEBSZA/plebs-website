import { NextResponse } from "next/server";
import { handlePaystackWebhook, isPaystackConfigured } from "@/lib/commerce/paystack";

export async function POST(request: Request) {
  if (!isPaystackConfigured()) {
    return NextResponse.json({ message: "Not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  const result = await handlePaystackWebhook(rawBody, signature);

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
