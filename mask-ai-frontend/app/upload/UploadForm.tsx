"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./UploadForm.module.css";

type Detection = {
  bbox: [number, number, number, number];
  label?: string;
  confidence?: number;
};

export default function UploadForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh hợp lệ");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File quá lớn. Vui lòng chọn file nhỏ hơn 10MB");
      return;
    }

    setError(null);
    setDetections([]);
    setIsLoading(true);
    
    const url = URL.createObjectURL(file);
    setPreview(url);

    const formData = new FormData();
    formData.append("file", file);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://mask-face-detection.onrender.com";
    const detectUrl = `${API_URL}/detect`;

    // Debug: log URL (chỉ trong development)
    if (process.env.NODE_ENV === 'development') {
      console.log("API URL:", API_URL);
      console.log("Detect URL:", detectUrl);
    }

    try {
      const res = await fetch(detectUrl, {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      const dets = data?.predictions || data?.result_image || [];
      setDetections(Array.isArray(dets) ? dets : []);
    } catch (err) {
      console.error("Upload error", err);
      const errorMessage = err instanceof Error 
        ? `Không thể kết nối đến server: ${err.message}` 
        : "Không thể kết nối đến server. Vui lòng kiểm tra backend URL.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleUpload(file);
    }
  };

  // Vẽ bounding box
  useEffect(() => {
    const draw = () => {
      const img = imgRef.current;
      const canvas = canvasRef.current;
      if (!img || !canvas || !detections.length) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.clientWidth;
      canvas.height = img.clientHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const natW = img.naturalWidth;
      const natH = img.naturalHeight;
      const scaleX = img.clientWidth / natW;
      const scaleY = img.clientHeight / natH;

      detections.forEach(d => {
        const [x1, y1, x2, y2] = d.bbox;
        const x = x1 * scaleX;
        const y = y1 * scaleY;
        const w = (x2 - x1) * scaleX;
        const h = (y2 - y1) * scaleY;

        // Màu theo label
        let color = "#10b981"; // with_mask
        if (d.label === "without_mask") color = "#ef4444";
        if (d.label === "mask_weared_incorrect") color = "#f59e0b";

        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, w, h);

        const label = `${d.label || "Unknown"} ${((d.confidence ?? 0) * 100).toFixed(0)}%`;
        ctx.font = "bold 18px Inter, sans-serif";
        const textWidth = ctx.measureText(label).width;
        const padding = 10;

        ctx.fillStyle = color;
        ctx.fillRect(x, y - 30, textWidth + padding * 2, 30);

        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, x + textWidth/2 + padding, y - 15);
      });
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [preview, detections]);

  // Thống kê
  const stats = detections.reduce((acc, d) => {
    const label = d.label || "unknown";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleReset = () => {
    setPreview(null);
    setDetections([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className={styles.title}>Upload & Phát Hiện Khẩu Trang</h2>
        <p className={styles.subtitle}>Tải lên ảnh để AI phân tích và phát hiện khẩu trang</p>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {!preview && (
        <div
          className={`${styles.uploadArea} ${isDragging ? styles.dragover : ""} ${isLoading ? styles.loading : ""}`}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); if (!isLoading) setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className={styles.hiddenInput}
            disabled={isLoading}
          />

          {isLoading ? (
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
              <div className={styles.uploadText}>Đang xử lý...</div>
            </div>
          ) : (
            <>
              <div className={styles.uploadIcon}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className={styles.iconGlow}></div>
              </div>
              <div className={styles.uploadText}>Kéo thả ảnh vào đây</div>
              <div className={styles.uploadSubtext}>Hoặc click để chọn từ máy tính</div>
              <div className={styles.uploadHint}>Hỗ trợ: JPG, PNG, WEBP (tối đa 10MB)</div>
            </>
          )}
        </div>
      )}

      {preview && (
        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <h3 className={styles.previewTitle}>Kết quả phân tích</h3>
            <button onClick={handleReset} className={styles.resetButton}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Tải ảnh khác
            </button>
          </div>
          <div className={styles.previewContainer}>
            <img ref={imgRef} src={preview} alt="Preview" className={styles.preview} />
            <canvas ref={canvasRef} className={styles.overlay} />
            {isLoading && (
              <div className={styles.previewLoading}>
                <div className={styles.spinner}></div>
                <span>Đang phân tích...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {detections.length > 0 && (
        <div className={styles.statsSection}>
          <h3 className={styles.statsTitle}>Thống kê phát hiện</h3>
          <div className={styles.stats}>
            <div className={`${styles.stat} ${styles.statSuccess}`}>
              <div className={styles.statIcon}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <strong>{stats["with_mask"] || 0}</strong>
              <span>Đeo đúng</span>
            </div>
            <div className={`${styles.stat} ${styles.statDanger}`}>
              <div className={styles.statIcon}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <strong>{stats["without_mask"] || 0}</strong>
              <span>Không đeo</span>
            </div>
            <div className={`${styles.stat} ${styles.statWarning}`}>
              <div className={styles.statIcon}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <strong>{stats["mask_weared_incorrect"] || 0}</strong>
              <span>Đeo sai</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}