import Link from "next/link";
import styles from "./Breadcrumbs.module.css";

type Crumb = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: readonly Crumb[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className={`container ${styles.breadcrumbs}`} aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} aria-current={isLast ? "page" : undefined}>
              {item.href && !isLast ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                item.label
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
