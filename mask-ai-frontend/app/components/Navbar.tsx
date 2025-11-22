// Navbar.tsx
import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.container} suppressHydrationWarning>
        <a href="/" className={styles.logo}>
          MaskGuard AI
        </a>
        <div className={styles.links} suppressHydrationWarning>
          <a href="/">Trang chủ</a>
          <a href="/upload">Upload ảnh</a>
          <a href="/webcam">Webcam Live</a>
        </div>
      </div>
    </nav>
  );
}