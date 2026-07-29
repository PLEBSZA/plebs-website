export function buildSku(input: {
  brandCode?: string;
  styleCode: string;
  colourCode: string;
  sizeCode: string;
}) {
  const brand = (input.brandCode ?? "PLB").trim().toUpperCase();
  const style = input.styleCode.trim().toUpperCase();
  const colour = input.colourCode.trim().toUpperCase();
  const size = input.sizeCode.trim().toUpperCase();

  if (!style || !colour || !size) {
    throw new Error("Style, colour and size codes are required to build a SKU.");
  }

  return `${brand}-${style}-${colour}-${size}`;
}

export function isValidSku(sku: string) {
  return /^[A-Z0-9]+(?:-[A-Z0-9]+)+$/.test(sku.trim().toUpperCase());
}
