"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useActionState,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  customerLoginAction,
  customerLogoutAction,
  type AccountFormState,
} from "@/app/account/actions";
import styles from "./AccountMenu.module.css";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const initialLogin: AccountFormState = {};

export type AccountMenuProps = {
  signedIn: boolean;
  homeHref: string;
  initials?: string;
  menuLabel?: string;
  isAdmin?: boolean;
};

export function AccountMenu({
  signedIn,
  homeHref,
  initials = "?",
  menuLabel = "Open account menu",
  isAdmin = false,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>();
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const emailId = useId();
  const passwordId = useId();

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const focusables = () =>
      panel
        ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
        : [];

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      const nodes = focusables();
      if (nodes.length === 0) return;
      if (signedIn && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        event.preventDefault();
        const index = nodes.indexOf(document.activeElement as HTMLElement);
        const offset = event.key === "ArrowDown" ? 1 : -1;
        const next = nodes[(index + offset + nodes.length) % nodes.length];
        next?.focus();
        return;
      }
      if (event.key !== "Tab") return;
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
    const nodes = focusables();
    (signedIn ? nodes[0] : panel?.querySelector<HTMLElement>("input"))?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      triggerRef.current?.focus();
    };
  }, [open, signedIn]);

  useLayoutEffect(() => {
    if (!open || !signedIn) return;

    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect || window.matchMedia("(max-width: 899px)").matches) {
        setMenuStyle(undefined);
        return;
      }
      setMenuStyle({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [open, signedIn]);

  function close() {
    setOpen(false);
  }

  return (
    <span className={styles.slot}>
      <Link
        ref={triggerRef}
        href={signedIn ? homeHref : "/account/login/"}
        className={signedIn ? styles.initials : styles.signIn}
        aria-haspopup={signedIn ? "menu" : "dialog"}
        aria-expanded={open}
        aria-label={signedIn ? menuLabel : "Sign in"}
        onClick={(event) => {
          event.preventDefault();
          setOpen((current) => !current);
        }}
      >
        {signedIn ? initials : "Sign in"}
      </Link>

      {open
        ? createPortal(
            <>
              <div
                className={signedIn ? styles.backdrop : styles.backdropDim}
                onMouseDown={close}
              />
              {signedIn ? (
                <div
                  ref={panelRef}
                  className={styles.menu}
                  role="menu"
                  aria-label="Account"
                  style={menuStyle}
                >
                  {isAdmin ? (
                    <Link
                      href="/admin/"
                      role="menuitem"
                      className={styles.menuItem}
                      onClick={close}
                    >
                      Admin
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/account/"
                        role="menuitem"
                        className={styles.menuItem}
                        onClick={close}
                      >
                        My account
                      </Link>
                      <Link
                        href="/account/orders/"
                        role="menuitem"
                        className={styles.menuItem}
                        onClick={close}
                      >
                        Orders
                      </Link>
                      <Link
                        href="/account/profile/"
                        role="menuitem"
                        className={styles.menuItem}
                        onClick={close}
                      >
                        Personal details
                      </Link>
                    </>
                  )}
                  <form action={customerLogoutAction}>
                    <button
                      type="submit"
                      role="menuitem"
                      className={styles.menuItem}
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              ) : (
                <SignInDialog
                  panelRef={panelRef}
                  titleId={titleId}
                  emailId={emailId}
                  passwordId={passwordId}
                  onClose={close}
                />
              )}
            </>,
            document.body,
          )
        : null}
    </span>
  );
}

function SignInDialog({
  panelRef,
  titleId,
  emailId,
  passwordId,
  onClose,
}: {
  panelRef: RefObject<HTMLDivElement | null>;
  titleId: string;
  emailId: string;
  passwordId: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(
    customerLoginAction,
    initialLogin,
  );
  const pathname = usePathname();

  return (
    <div
      ref={panelRef}
      className={styles.dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className={styles.dialogHeader}>
        <h2 id={titleId}>Sign in</h2>
        <button type="button" className={styles.close} onClick={onClose}>
          Close
        </button>
      </div>
      <form className={styles.form} action={action} noValidate>
        <input type="hidden" name="callbackUrl" value={pathname || "/account/"} />
        <div className={styles.field}>
          <label htmlFor={emailId}>Email</label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="username"
            required
          />
          {state.fieldErrors?.email ? (
            <p className={styles.error}>{state.fieldErrors.email[0]}</p>
          ) : null}
        </div>
        <div className={styles.field}>
          <label htmlFor={passwordId}>Password</label>
          <input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          {state.fieldErrors?.password ? (
            <p className={styles.error}>{state.fieldErrors.password[0]}</p>
          ) : null}
        </div>
        {state.error ? <p className={styles.error}>{state.error}</p> : null}
        <button className={styles.submit} type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
        <p>
          <Link
            href="/account/forgot-password/"
            className={styles.link}
            onClick={onClose}
          >
            Forgot password?
          </Link>
        </p>
        <p className={styles.footer}>
          New to Plebs?{" "}
          <Link
            href="/account/register/"
            className={styles.link}
            onClick={onClose}
          >
            Create account
          </Link>
        </p>
      </form>
    </div>
  );
}

export function AccountMenuFallback() {
  return (
    <span className={styles.slot}>
      <Link href="/account/login/" className={styles.signIn}>
        Sign in
      </Link>
    </span>
  );
}
