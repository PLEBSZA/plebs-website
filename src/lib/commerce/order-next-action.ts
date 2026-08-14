import {
  FulfilmentStatus,
  OrderStatus,
  PaymentStatus,
  ReturnStatus,
} from "@/generated/prisma/client";

export type OrderNextAction =
  | "Awaiting payment"
  | "Inventory hold"
  | "Ready to pack"
  | "Ready to dispatch"
  | "In transit"
  | "Confirm delivery"
  | "Complete order"
  | "Process return"
  | "None";

const TERMINAL_RETURN_STATUSES = new Set<ReturnStatus>([
  ReturnStatus.CLOSED,
  ReturnStatus.REJECTED,
  ReturnStatus.REFUNDED,
]);

export function hasOpenReturn(
  returnRequests: { status: ReturnStatus }[] | undefined,
) {
  return (returnRequests ?? []).some(
    (entry) => !TERMINAL_RETURN_STATUSES.has(entry.status),
  );
}

/**
 * Derived label for the Open orders view / overview cards.
 * Keep button visibility in OrderActionsPanel aligned with this helper.
 */
export function getOrderNextAction(order: {
  status: OrderStatus | string;
  paymentStatus: PaymentStatus | string;
  fulfilmentStatus: FulfilmentStatus | string;
  inventoryHold?: boolean;
  returnRequests?: { status: ReturnStatus }[];
}): OrderNextAction {
  if (order.status === OrderStatus.CANCELLED || order.status === "CANCELLED") {
    return "None";
  }
  if (hasOpenReturn(order.returnRequests)) {
    return "Process return";
  }
  if (
    order.paymentStatus === PaymentStatus.PENDING ||
    order.paymentStatus === "PENDING"
  ) {
    return "Awaiting payment";
  }
  if (order.inventoryHold) {
    return "Inventory hold";
  }
  if (
    order.fulfilmentStatus === FulfilmentStatus.UNFULFILLED ||
    order.fulfilmentStatus === "UNFULFILLED" ||
    order.fulfilmentStatus === FulfilmentStatus.PROCESSING ||
    order.fulfilmentStatus === "PROCESSING"
  ) {
    return "Ready to pack";
  }
  if (
    order.fulfilmentStatus === FulfilmentStatus.PACKED ||
    order.fulfilmentStatus === "PACKED"
  ) {
    return "Ready to dispatch";
  }
  if (
    order.fulfilmentStatus === FulfilmentStatus.FULFILLED ||
    order.fulfilmentStatus === "FULFILLED"
  ) {
    return "Confirm delivery";
  }
  if (
    order.fulfilmentStatus === FulfilmentStatus.DELIVERED ||
    order.fulfilmentStatus === "DELIVERED"
  ) {
    if (order.status === OrderStatus.COMPLETED || order.status === "COMPLETED") {
      return "None";
    }
    return "Complete order";
  }
  return "None";
}

/** Lower = more urgent for Open-view sort (oldest within same priority first). */
export function getOpenOrderSortPriority(order: {
  paymentStatus: PaymentStatus | string;
  fulfilmentStatus: FulfilmentStatus | string;
  inventoryHold?: boolean;
  returnRequests?: { status: ReturnStatus }[];
}): number {
  const action = getOrderNextAction({
    status: OrderStatus.OPEN,
    ...order,
  });
  switch (action) {
    case "Inventory hold":
      return 0;
    case "Process return":
      return 1;
    case "Confirm delivery":
      return 2;
    case "Ready to dispatch":
      return 3;
    case "Ready to pack":
      return 4;
    case "Complete order":
      return 5;
    case "Awaiting payment":
      return 6;
    default:
      return 9;
  }
}
