import "server-only";

import type { ReactElement } from "react";
import { render } from "react-email";
import { Resend } from "resend";

type SendEmailBase = {
  to: string | string[];
  subject: string;
  replyTo?: string;
  idempotencyKey: string;
};

type SendEmailInput = SendEmailBase &
  (
    | {
        react: ReactElement;
        text?: string;
        html?: never;
      }
    | {
        html: string;
        text: string;
        react?: never;
      }
    | {
        template: {
          id: string;
          variables?: Record<string, string | number>;
        };
        react?: never;
        html?: never;
        text?: never;
      }
  );

export function isResendConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      process.env.RESEND_FROM_EMAIL?.trim(),
  );
}

export function getContactEmail() {
  return process.env.CONTACT_TO_EMAIL?.trim() || "hello@plebs.co.za";
}

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function sendEmail(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    return { sent: false as const, reason: "not_configured" as const };
  }

  const resend = new Resend(apiKey);
  const content =
    "template" in input && input.template
      ? { template: input.template }
      : "react" in input && input.react
      ? {
          react: input.react,
          text: input.text ?? (await render(input.react, { plainText: true })),
        }
      : {
          html: input.html,
          text: input.text,
        };
  const { data, error } = await resend.emails.send(
    {
      from,
      to: input.to,
      subject: input.subject,
      ...content,
      replyTo: input.replyTo,
    },
    { idempotencyKey: input.idempotencyKey },
  );

  if (error) {
    throw new Error(error.message);
  }

  return { sent: true as const, id: data?.id ?? null };
}
