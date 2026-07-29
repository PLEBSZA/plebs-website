"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useCart } from "@/components/cart/CartProvider";
import {
  getDefaultPurchasableCatalogueSize,
  useStorefrontCatalogue,
} from "@/components/commerce/StorefrontCatalogueProvider";
import { RestockNotifyForm } from "@/components/product/RestockNotifyForm";
import { formatMoney } from "@/lib/money";
import styles from "./ProductPurchaseExperience.module.css";

type PurchaseContextValue = {
  colour: string;
  size: string;
  quantity: number;
  setColour: (colour: string) => void;
  setSize: (size: string) => void;
  setQuantity: (quantity: number) => void;
};

const PurchaseContext = createContext<PurchaseContextValue | null>(null);

function usePurchase() {
  const context = useContext(PurchaseContext);
  if (!context) {
    throw new Error("Product purchase components require ProductPurchaseProvider");
  }
  return context;
}

export function ProductPurchaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const catalogue = useStorefrontCatalogue();
  const defaultSize = getDefaultPurchasableCatalogueSize(catalogue)?.name ?? "";
  const defaultColour =
    catalogue.colours.find((colour) => colour.available)?.name ??
    catalogue.colours[0]?.name ??
    "Forest Green";

  const [colour, setColour] = useState(defaultColour);
  const [size, setSize] = useState(defaultSize);
  const [quantity, setQuantity] = useState(1);

  const resolvedSize = size || defaultSize;

  const value = useMemo(
    () => ({
      colour,
      size: resolvedSize,
      quantity,
      setColour,
      setSize,
      setQuantity,
    }),
    [colour, resolvedSize, quantity],
  );

  return (
    <PurchaseContext.Provider value={value}>
      {children}
    </PurchaseContext.Provider>
  );
}

type ProductPurchasePanelProps = {
  id: string;
  compact?: boolean;
};

export function ProductPurchasePanel({
  id,
  compact = false,
}: ProductPurchasePanelProps) {
  const catalogue = useStorefrontCatalogue();
  const { colour, size, quantity, setColour, setSize, setQuantity } =
    usePurchase();
  const { addItem, maxQuantity } = useCart();
  const [message, setMessage] = useState("");

  function chooseSize(nextSize: string) {
    setSize(nextSize);
    setMessage("");
  }

  function handleAddToCart() {
    if (!size) {
      setMessage("Please select an available size before adding to your cart.");
      return;
    }

    const result = addItem({ colour, size, quantity });
    setMessage(result.message);
  }

  const hasUnavailableSizes = catalogue.sizes.some((entry) => !entry.available);
  const selectedSize = catalogue.sizes.find((entry) => entry.name === size);
  const sizeS = catalogue.sizes.find((entry) => entry.name === "S");

  return (
    <div
      id={id}
      className={[styles.panel, compact ? styles.compact : ""]
        .filter(Boolean)
        .join(" ")}
      data-purchase-panel
    >
      {catalogue.price != null ? (
        <p className={styles.priceDisplay}>{formatMoney(catalogue.price)}</p>
      ) : null}

      <fieldset className={styles.fieldset}>
        <legend>Colour: {colour}</legend>
        <div className={styles.colours}>
          {catalogue.colours.map((option) => (
            <button
              key={option.id}
              type="button"
              className={styles.colourButton}
              aria-pressed={colour === option.name}
              disabled={!option.available}
              onClick={() => {
                if (option.available) {
                  setColour(option.name);
                }
              }}
              data-event="select_colour"
              data-event-label={option.name}
              aria-label={
                option.available
                  ? option.name
                  : `${option.name} availability to be confirmed`
              }
            >
              <span
                className={
                  option.id === "earth-tone"
                    ? styles.earthSwatch
                    : styles.forestSwatch
                }
                aria-hidden="true"
              />
              <span>
                {option.available
                  ? option.name
                  : `${option.name} — TBC`}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className="visually-hidden">Size selection</legend>
        <div className={styles.legendRow}>
          <p>Size{size ? `: ${size}` : ""}</p>
          <Link href="/size-guide/" data-event="view_size_guide">
            View Size Guide
          </Link>
        </div>
        <div className={styles.sizes}>
          {catalogue.sizes.map((option) => (
            <button
              key={option.id}
              type="button"
              className={[
                styles.sizeButton,
                size === option.name ? styles.selectedSize : "",
                !option.available ? styles.unavailableSize : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={size === option.name}
              aria-label={
                option.available
                  ? `Size ${option.name}, in stock`
                  : `Size ${option.name}, out of stock`
              }
              disabled={!option.available}
              onClick={() => chooseSize(option.name)}
              data-event={option.available ? "select_size" : undefined}
              data-event-label={option.name}
              data-selected-size={option.name}
              data-availability={
                option.available ? "in_stock" : "out_of_stock"
              }
              data-variant-sku={option.sku || undefined}
              data-colour={colour}
            >
              <span>{option.name}</span>
              {!option.available ? (
                <span className="visually-hidden">Out of stock</span>
              ) : null}
            </button>
          ))}
        </div>
        <p className={styles.availabilityNote}>
          {sizeS?.available
            ? "Size S is currently available. Other sizes can be requested below."
            : "No sizes are currently available. Join the restock list below."}
        </p>
      </fieldset>

      <div className={styles.purchaseRow}>
        <div className={styles.quantity}>
          <span id={`${id}-quantity-label`}>Quantity</span>
          <div className={styles.stepper}>
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <output aria-labelledby={`${id}-quantity-label`}>{quantity}</output>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              disabled={quantity >= maxQuantity}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
        <p className={styles.stock}>
          {selectedSize?.available ? (
            <>
              <span className={styles.inStockBadge}>In stock</span>
              <strong>
                Size {selectedSize.name} has {selectedSize.stockQuantity} available.
              </strong>
            </>
          ) : (
            <strong>Select an in-stock size to purchase.</strong>
          )}
        </p>
      </div>

      <button
        type="button"
        className={styles.addButton}
        onClick={handleAddToCart}
        disabled={!selectedSize?.available}
      >
        Add to Cart
      </button>

      <div className={styles.messageSlot}>
        {message ? (
          <p className={styles.status} role="status">
            {message}
          </p>
        ) : null}
      </div>

      <div className={styles.reassurance} aria-label="Purchase reassurance">
        <p>
          <strong>✓ Secure checkout</strong>
        </p>
        <p>
          <strong>✓ Tracked delivery</strong>
        </p>
        <p>
          <strong>✓ Size exchanges available</strong>
        </p>
      </div>

      {hasUnavailableSizes ? <RestockNotifyForm colour={colour} /> : null}
    </div>
  );
}

export function ProductStickyPurchaseBar() {
  const catalogue = useStorefrontCatalogue();
  const { size, colour } = usePurchase();
  const { addItem } = useCart();
  const [visible, setVisible] = useState(false);
  const defaultSize =
    getDefaultPurchasableCatalogueSize(catalogue)?.name ?? "";

  useEffect(() => {
    const panels = Array.from(
      document.querySelectorAll<HTMLElement>("[data-purchase-panel]"),
    );
    if (panels.length === 0) return;

    function updateVisibility() {
      const anyPanelVisible = panels.some((panel) => {
        const rect = panel.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight;
      });
      const topPanelPassed = panels[0]?.getBoundingClientRect().bottom < 0;
      const cartOpen = document.body.dataset.cartOpen === "true";
      setVisible(topPanelPassed && !anyPanelVisible && !cartOpen);
    }

    const observer = new IntersectionObserver(updateVisibility, {
      threshold: 0.05,
    });

    panels.forEach((panel) => {
      observer.observe(panel);
    });

    window.addEventListener("scroll", updateVisibility, { passive: true });
    updateVisibility();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateVisibility);
    };
  }, []);

  return (
    <div
      className={[styles.stickyBar, visible ? styles.stickyVisible : ""]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={!visible}
    >
      <div className={styles.stickyInner}>
        <div>
          <p>PLEBS Dungarees{size ? ` · Size ${size}` : ""}</p>
          {catalogue.price != null ? (
            <span>{formatMoney(catalogue.price)}</span>
          ) : null}
        </div>
        <button
          type="button"
          tabIndex={visible ? 0 : -1}
          onClick={() =>
            addItem({
              colour,
              size: size || defaultSize,
              quantity: 1,
            })
          }
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
