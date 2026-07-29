export type ShippingMethod = {
  id: string;
  name: string;
  description: string;
  estimatedArrival: string;
  price: number;
  trackingIncluded: boolean;
};

/**
 * Shipping methods remain provisional until courier contracts are confirmed.
 * Costs are shown before payment as required by the checkout architecture.
 */
export const shippingMethods: ShippingMethod[] = [
  {
    id: "standard",
    name: "Standard Delivery",
    description: "Tracked courier delivery within South Africa.",
    estimatedArrival: "Timing to be confirmed",
    price: 0,
    trackingIncluded: true,
  },
];

export function getShippingMethod(id: string): ShippingMethod | undefined {
  return shippingMethods.find((method) => method.id === id);
}
