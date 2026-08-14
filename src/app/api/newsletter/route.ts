import { NextResponse } from "next/server";
import { subscribeToNewsletter } from "@/lib/account/newsletter";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; consent?: boolean };
  const result = await subscribeToNewsletter({
    email: body.email ?? "",
    consent: body.consent === true,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  return NextResponse.json({ message: result.message });
}
