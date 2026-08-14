"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { primaryProductImage } from "@/lib/media";
import { formatMoney } from "@/lib/money";
import { productData } from "@/lib/product";
import { useCart } from "./CartProvider";
import styles from "./CartDrawer.module.css";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function CartDrawer() {
  const {
    line,
    open,
    subtotal,
    maxQuantity,
    closeCart,
    removeItem,
    updateQuantity,
  } = useCart();
  const drawerRef = useRef<HTMLElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const drawer = drawerRef.current;
    const focusables = () =>
      drawer
        ? Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE))
        : [];

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeCart();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = focusables();
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    focusables()[0]?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus();
    };
  }, [open, closeCart]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onMouseDown={closeCart}>
      <aside
        ref={drawerRef}
        id="cart-drawer"
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.heading}>
          <h2>Your Cart</h2>
          <button type="button" onClick={closeCart}>
            Close
          </button>
        </div>

        {line ? (
          <>
            <div className={styles.body}>
              <div className={styles.line}>
                <div className={styles.media} aria-hidden="true">
                  <Image
                    src={primaryProductImage.src}
                    alt=""
                    width={primaryProductImage.width}
                    height={primaryProductImage.height}
                    className={styles.image}
                    sizes="104px"
                  />
                </div>
                <div className={styles.details}>
                  <p className={styles.product}>{productData.shortName}</p>
                  <p>{line.colour}</p>
                  <p>Size {line.size}</p>
                  <div className={styles.quantity}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.quantity - 1)}
                      disabled={line.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.quantity + 1)}
                      disabled={line.quantity >= maxQuantity}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <p className={styles.price}>
                    {formatMoney(line.unitPrice * line.quantity)}
                  </p>
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={removeItem}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className={styles.summary}>
                <div>
                  <span>Subtotal</span>
                  <strong>{formatMoney(subtotal)}</strong>
                </div>
                <p>Free tracked delivery in South Africa</p>
                <div>
                  <span>Total</span>
                  <strong>{formatMoney(subtotal)}</strong>
                </div>
              </div>
            </div>

            <div className={styles.footer}>
              <Link
                href="/checkout/"
                className={styles.checkout}
                onClick={() => {
                  closeCart();
                  window.dispatchEvent(
                    new CustomEvent("plebs:commerce-event", {
                      detail: {
                        event: "begin_checkout",
                        selected_size: line.size,
                        availability: "in_stock",
                        variant_sku: line.sku,
                        colour: line.colour,
                        quantity: line.quantity,
                      },
                    }),
                  );
                }}
              >
                Checkout
              </Link>
            </div>
          </>
        ) : (
          <div className={styles.empty}>
            <h3>Your cart is waiting.</h3>
            <p>Add the PLEBS dungarees to get started.</p>
            <Link
              href={productData.path}
              className={styles.checkout}
              onClick={closeCart}
            >
              Shop the Dungarees
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
