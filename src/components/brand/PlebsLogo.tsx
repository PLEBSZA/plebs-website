import styles from "./PlebsLogo.module.css";

type PlebsLogoProps = {
  className?: string;
  title?: string;
  decorative?: boolean;
};

export function PlebsLogo({
  className,
  title = "PLEBS",
  decorative = true,
}: PlebsLogoProps) {
  return (
    <img
      className={[styles.logo, className].filter(Boolean).join(" ")}
      src="/images/brand/plebs-wordmark.svg"
      alt={decorative ? "" : title}
      aria-hidden={decorative ? "true" : undefined}
    />
  );
}
