import { NextResponse } from "next/server";
import {
  getContactEmail,
  isResendConfigured,
  sendEmail,
} from "@/lib/email/resend";
import { emailTemplateAliases } from "@/lib/email/template-aliases";
import { createRestockRequest } from "@/lib/restock";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    size?: string;
    colour?: string;
    marketingConsent?: boolean;
  };

  const result = await createRestockRequest({
    email: body.email ?? "",
    size: body.size ?? "",
    colour: body.colour,
    marketingConsent: body.marketingConsent === true,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  if (isResendConfigured()) {
    try {
      await sendEmail({
        to: result.request.email,
        replyTo: getContactEmail(),
        subject: `Restock request saved · ${result.request.colour}, size ${result.request.size}`,
        idempotencyKey: `restock-requested/${result.request.id}`,
        template: {
          id: emailTemplateAliases.restockRequested,
          variables: {
            COLOUR: result.request.colour,
            SIZE: result.request.size,
          },
        },
      });
    } catch (error) {
      console.error(
        "Restock confirmation could not be sent:",
        error instanceof Error ? error.message : "Unknown email error",
      );
    }
  }

  return NextResponse.json({
    message: "We'll let you know when this size returns.",
    request: result.request,
  });
}
