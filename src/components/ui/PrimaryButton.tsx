import Link from "next/link";
import styles from "./PrimaryButton.module.css";

type PrimaryButtonProps = {
  href?: string;
  children: React.ReactNode;
  type?: "button" | "submit";
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  eventName?: string;
};

export function PrimaryButton({
  href,
  children,
  type = "button",
  fullWidth = false,
  disabled = false,
  onClick,
  className = "",
  eventName,
}: PrimaryButtonProps) {
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
      disabled={disabled}
      onClick={onClick}
      data-event={eventName}
    >
      {children}
    </button>
  );
}
