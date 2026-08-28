import Link from "next/link";
import styles from "./home.module.css";

export default function Home() {
  return (
    <main className={styles.wrap}>
      <div className={styles.mark}>
        <span className={styles.markCorner} data-pos="tl" />
        <span className={styles.markCorner} data-pos="tr" />
        <span className={styles.markCorner} data-pos="bl" />
        <span className={styles.markCorner} data-pos="br" />
        <span className={styles.markDot} />
      </div>
      <p className={styles.eyebrow}>Ticket check-in</p>
      <h1 className={styles.title}>Wedding Entry</h1>
      <p className={styles.sub}>
        Anonymous QR ticket validation. No guest names, no guest data — just
        codes.
      </p>
      <div className={styles.actions}>
        <Link href="/guard" className={styles.primary}>
          Open Guard Mode
        </Link>
        <Link href="/admin" className={styles.secondary}>
          Admin Panel
        </Link>
      </div>
    </main>
  );
}
