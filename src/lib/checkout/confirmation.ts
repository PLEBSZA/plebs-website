export type ConfirmationTone = "paid" | "failed" | "pending";

export function confirmationTone(input: {
  paid: boolean;
  paymentFailed: boolean;
}): ConfirmationTone {
  if (input.paid) return "paid";
  if (input.paymentFailed) return "failed";
  return "pending";
}

export function confirmationCopy(tone: ConfirmationTone) {
  if (tone === "paid") {
    return {
      kicker: "Order confirmed",
      heading: "Thank you.",
      body: "Your payment was successful and your PLEBS order is confirmed.",
      paymentLabel: "Paid securely through Paystack",
    };
  }
  if (tone === "failed") {
    return {
      kicker: "Payment unsuccessful",
      heading: "Payment unsuccessful.",
      body: "Paystack could not confirm this payment. No order will be fulfilled until payment succeeds.",
      paymentLabel: "Payment unsuccessful",
    };
  }
  return {
    kicker: "Payment pending",
    heading: "Payment pending",
    body: "Your PLEBS order has been received and is awaiting payment.",
    paymentLabel: "Awaiting payment",
  };
}

export function shouldClearCartOnConfirmation(paid: boolean) {
  return paid;
}

export function shouldEmitPurchaseAnalytics(paid: boolean) {
  return paid;
}
