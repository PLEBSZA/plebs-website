import styles from "./SectionHeading.module.css";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  as?: "h2" | "h3";
  align?: "left" | "center";
  light?: boolean;
  children?: React.ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  as = "h2",
  align = "left",
  light = false,
  children,
}: SectionHeadingProps) {
  const HeadingTag = as;

  return (
    <header
      className={[
        styles.heading,
        align === "center" ? styles.center : "",
        light ? styles.light : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <HeadingTag className={styles.title}>{title}</HeadingTag>
      {children ? <div className={styles.body}>{children}</div> : null}
    </header>
  );
}
