import type { CheckoutUiState } from "./policy";

export type CheckoutStepHandoff = "review" | "details" | null;

export function checkoutStepHandoff(
  previous: CheckoutUiState,
  next: CheckoutUiState,
): CheckoutStepHandoff {
  if (previous === "DETAILS" && next !== "DETAILS") return "review";
  if (previous !== "DETAILS" && next === "DETAILS") return "details";
  return null;
}

export function checkoutStepScrollBehavior(
  prefersReducedMotion: boolean,
): ScrollBehavior {
  return prefersReducedMotion ? "auto" : "smooth";
}

export function handoffCheckoutStepFocus(input: {
  scrollTarget?: HTMLElement | null;
  focusTarget?: HTMLElement | null;
  prefersReducedMotion: boolean;
}) {
  input.scrollTarget?.scrollIntoView({
    block: "start",
    inline: "nearest",
    behavior: checkoutStepScrollBehavior(input.prefersReducedMotion),
  });
  input.focusTarget?.focus({ preventScroll: true });
}
