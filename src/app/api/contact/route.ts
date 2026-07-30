import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getContactEmail,
  isResendConfigured,
  sendEmail,
} from "@/lib/email/resend";
import { emailTemplateAliases } from "@/lib/email/template-aliases";

const enquiryTypes = [
  "Product and sizing question",
  "Existing order",
  "Exchange or return",
  "Stock or restock",
  "Press or collaboration",
  "General enquiry",
] as const;

const contactSchema = z.object({
  submissionId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  orderNumber: z.string().trim().max(80).optional().default(""),
  enquiryType: z.enum(enquiryTypes),
  message: z.string().trim().min(10).max(2000),
  website: z.string().max(0).optional().default(""),
});

export async function POST(request: Request) {
  if (!isResendConfigured()) {
    return NextResponse.json(
      { message: "Email delivery is not configured yet." },
      { status: 503 },
    );
  }

  const parsed = contactSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Check the form and complete all required fields." },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const destination = getContactEmail();
  const firstName = input.name.split(/\s+/)[0] || input.name;

  try {
    const ownerResult = await sendEmail({
      to: destination,
      replyTo: input.email,
      subject: `${input.enquiryType} · ${input.name}`,
      idempotencyKey: `contact-owner/${input.submissionId}`,
      template: {
        id: emailTemplateAliases.contactOwner,
        variables: {
          CUSTOMER_NAME: input.name,
          CUSTOMER_EMAIL: input.email,
          ENQUIRY_TYPE: input.enquiryType,
          ORDER_NUMBER: input.orderNumber || "Not provided",
          MESSAGE: input.message,
        },
      },
    });

    if (!ownerResult.sent) {
      return NextResponse.json(
        { message: "Email delivery is not configured yet." },
        { status: 503 },
      );
    }

    try {
      await sendEmail({
        to: input.email,
        replyTo: destination,
        subject: "We received your PLEBS enquiry",
        idempotencyKey: `contact-customer/${input.submissionId}`,
        template: {
          id: emailTemplateAliases.contactReceived,
          variables: {
            CUSTOMER_FIRST_NAME: firstName,
            ENQUIRY_TYPE: input.enquiryType,
          },
        },
      });
    } catch (confirmationError) {
      console.error(
        "Contact confirmation could not be sent:",
        confirmationError instanceof Error
          ? confirmationError.message
          : "Unknown email error",
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "Contact email could not be sent:",
      error instanceof Error ? error.message : "Unknown email error",
    );
    return NextResponse.json(
      { message: "Your message could not be sent. Please try again." },
      { status: 502 },
    );
  }
}
