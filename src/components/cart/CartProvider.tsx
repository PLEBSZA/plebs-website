"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  getCatalogueSize,
  getDefaultPurchasableCatalogueSize,
  isCatalogueVariantPurchasable,
  useStorefrontCatalogue,
} from "@/components/commerce/StorefrontCatalogueProvider";

export type CartLine = {
  colour: string;
  size: string;
  quantity: number;
  sku: string | null;
  unitPrice: number;
  variantId?: string;
};

type AddResult = {
  ok: boolean;
  message: string;
};

type CartContextValue = {
  line: CartLine | null;
  count: number;
  subtotal: number;
  open: boolean;
  maxQuantity: number;
  addItem: (line: Omit<CartLine, "sku" | "unitPrice" | "variantId">) => AddResult;
  updateQuantity: (quantity: number) => AddResult;
  removeItem: () => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function setCartOpenState(open: boolean) {
  if (typeof document !== "undefined") {
    document.body.dataset.cartOpen = String(open);
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const catalogue = useStorefrontCatalogue();
  const [line, setLine] = useState<CartLine | null>(null);
  const [open, setOpen] = useState(false);

  const openCart = useCallback(() => {
    setOpen(true);
    setCartOpenState(true);
  }, []);

  const closeCart = useCallback(() => {
    setOpen(false);
    setCartOpenState(false);
  }, []);

  const addItem = useCallback(
    (
      input: Omit<CartLine, "sku" | "unitPrice" | "variantId">,
    ): AddResult => {
      const size = getCatalogueSize(catalogue, input.size);

      if (!size) {
        return { ok: false, message: "Please choose a valid size." };
      }

      if (!isCatalogueVariantPurchasable(catalogue, input)) {
        return {
          ok: false,
          message: `Size ${size.name} is currently out of stock.`,
        };
      }

      if (catalogue.price == null) {
        return {
          ok: false,
          message: "Checkout is not available until pricing is confirmed.",
        };
      }

      const maxQuantity = size.stockQuantity;
      const requested = Math.max(1, input.quantity);

      if (requested > maxQuantity) {
        return {
          ok: false,
          message:
            maxQuantity === 0
              ? `Unfortunately Size ${size.name} became unavailable before your purchase completed.`
              : `Only ${maxQuantity} Size ${size.name} dungaree${maxQuantity === 1 ? "" : "s"} remain available.`,
        };
      }

      const nextLine: CartLine = {
        colour: input.colour,
        size: size.name,
        quantity: requested,
        sku: size.sku,
        unitPrice: catalogue.price,
        variantId: size.variantId || undefined,
      };

      setLine(nextLine);
      openCart();
      window.dispatchEvent(
        new CustomEvent("plebs:commerce-event", {
          detail: {
            event: "add_to_cart",
            selected_size: nextLine.size,
            availability: "in_stock",
            variant_sku: nextLine.sku,
            colour: nextLine.colour,
            quantity: nextLine.quantity,
          },
        }),
      );

      return {
        ok: true,
        message: `Size ${nextLine.size} was added to your cart.`,
      };
    },
    [catalogue, openCart],
  );

  const updateQuantity = useCallback(
    (quantity: number): AddResult => {
      if (!line) {
        return { ok: false, message: "Your cart is empty." };
      }

      const size = getCatalogueSize(catalogue, line.size);
      const maxQuantity = size?.stockQuantity ?? 0;
      const nextQuantity = Math.max(1, quantity);

      if (nextQuantity > maxQuantity) {
        return {
          ok: false,
          message:
            maxQuantity === 0
              ? `Unfortunately Size ${line.size} became unavailable before your purchase completed.`
              : `Only ${maxQuantity} Size ${line.size} dungaree${maxQuantity === 1 ? "" : "s"} remain available.`,
        };
      }

      setLine({ ...line, quantity: nextQuantity });
      return { ok: true, message: "Quantity updated." };
    },
    [catalogue, line],
  );

  const removeItem = useCallback(() => {
    if (line) {
      window.dispatchEvent(
        new CustomEvent("plebs:commerce-event", {
          detail: {
            event: "remove_from_cart",
            selected_size: line.size,
            availability: "in_stock",
            variant_sku: line.sku,
            colour: line.colour,
            quantity: line.quantity,
          },
        }),
      );
    }
    setLine(null);
  }, [line]);

  const clearCart = useCallback(() => {
    setLine(null);
  }, []);

  const maxQuantity = line
    ? (getCatalogueSize(catalogue, line.size)?.stockQuantity ?? 0)
    : (getDefaultPurchasableCatalogueSize(catalogue)?.stockQuantity ?? 0);

  const value = useMemo<CartContextValue>(
    () => ({
      line,
      count: line?.quantity ?? 0,
      subtotal: line ? Number((line.unitPrice * line.quantity).toFixed(2)) : 0,
      open,
      maxQuantity,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      openCart,
      closeCart,
    }),
    [
      line,
      open,
      maxQuantity,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      openCart,
      closeCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
