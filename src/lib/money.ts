export function formatMoney(amount: number, currency = "ZAR"): string {
  if (currency === "ZAR") {
    return `R${amount.toFixed(2)}`;
  }

  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
  }).format(amount);
}
