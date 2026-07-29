import styles from "./ImagePlaceholder.module.css";

type ImagePlaceholderProps = {
  label: string;
  aspect?: "portrait" | "square" | "landscape" | "wide";
  className?: string;
};

export function ImagePlaceholder({
  label,
  aspect = "portrait",
  className = "",
}: ImagePlaceholderProps) {
  return (
    <div
      className={[styles.placeholder, styles[aspect], className]
        .filter(Boolean)
        .join(" ")}
      role="img"
      aria-label={`${label} — product photography coming soon`}
    >
      <div className={styles.inner}>
        <span className={styles.kicker}>Photography pending</span>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}
