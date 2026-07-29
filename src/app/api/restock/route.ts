import { NextResponse } from "next/server";
import { createRestockRequest } from "@/lib/restock";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    size?: string;
    colour?: string;
  };

  const result = await createRestockRequest({
    email: body.email ?? "",
    size: body.size ?? "",
    colour: body.colour,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  return NextResponse.json({
    message: "We'll let you know when this size returns.",
    request: result.request,
  });
}
