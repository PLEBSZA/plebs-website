import Link from "next/link";
import styles from "./SecondaryButton.module.css";

type SecondaryButtonProps = {
  href?: string;
  children: React.ReactNode;
  type?: "button" | "submit";
  fullWidth?: boolean;
  onClick?: () => void;
  className?: string;
  eventName?: string;
};

export function SecondaryButton({
  href,
  children,
  type = "button",
  fullWidth = false,
  onClick,
  className = "",
  eventName,
}: SecondaryButtonProps) {
  const classNames = [
    styles.button,
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={classNames} data-event={eventName}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classNames}
      onClick={onClick}
      data-event={eventName}
    >
      {children}
    </button>
  );
}
