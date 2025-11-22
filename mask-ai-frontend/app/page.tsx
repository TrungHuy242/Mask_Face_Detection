// app/page.tsx
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.container} suppressHydrationWarning>
      <div className={styles.heroSection}>
        <div className={styles.badge}>
          <span className={styles.badgeIcon}>🤖</span>
          <span>Powered by AI & TensorFlow</span>
        </div>
        <h1 className={styles.heroTitle}>
          Phát Hiện Khẩu Trang
          <span className={styles.gradientText}> Bằng AI</span>
        </h1>
        <p className={styles.heroDesc}>
          Ứng dụng AI thông minh giúp phát hiện người đeo khẩu trang đúng cách, đeo sai hoặc không đeo – 
          hỗ trợ cả upload ảnh và webcam real-time với độ chính xác cực cao.
        </p>
      </div>

      <div className={styles.featuresGrid} suppressHydrationWarning>
        <a href="/upload" className={styles.featureCard}>
          <div className={styles.iconWrapper}>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className={styles.iconGlow}></div>
          </div>
          <h3 className={styles.featureTitle}>Upload Ảnh</h3>
          <p className={styles.featureDesc}>
            Kéo thả hoặc chọn ảnh từ máy tính, AI sẽ phân tích ngay lập tức và hiển thị kết quả với bounding box.
          </p>
          <div className={styles.cardArrow}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </a>

        <a href="/webcam" className={styles.featureCard}>
          <div className={styles.iconWrapper}>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className={styles.iconGlow}></div>
          </div>
          <h3 className={styles.featureTitle}>Webcam Real-time</h3>
          <p className={styles.featureDesc}>
            Bật camera và xem AI phát hiện khẩu trang trực tiếp trên khuôn mặt bạn – mượt mà, không lag.
          </p>
          <div className={styles.cardArrow}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </a>
      </div>
    </div>
  );
}