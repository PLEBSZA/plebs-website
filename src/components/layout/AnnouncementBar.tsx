import styles from "./AnnouncementBar.module.css";

export function AnnouncementBar() {
  return (
    <div className={styles.bar} role="region" aria-label="Site announcement">
      <p className={styles.text}>
        <span className={styles.desktopCopy}>
          The PLEBS Original · 100% Cotton Corduroy
        </span>
        <span className={styles.mobileCopy}>
          The PLEBS Original · Cotton Corduroy
        </span>
      </p>
    </div>
  );
}
