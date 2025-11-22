"use client";

import { useRef, useEffect, useState } from "react";
import styles from "./WebcamView.module.css";

type Detection = {
  bbox: [number, number, number, number]; // [x1,y1,x2,y2]
  label?: string;
  confidence?: number;
};

export default function WebcamView() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [detections, setDetections] = useState<Detection[] | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());

  useEffect(() => {
    let mounted = true;
    let sendInterval: number | null = null;

    async function startCamera() {
      try {
        setIsLoading(true);
        setError(null);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsLoading(false);
        startWebSocket();
      } catch (err) {
        setIsLoading(false);
        setError("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
        console.error("Camera error:", err);
      }
    }

    function startWebSocket() {
      const WS_URL = "ws://localhost:8000/ws";
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        // send frames ~5 FPS to backend if needed
        sendInterval = window.setInterval(() => sendFrame(), 200) as unknown as number;
      };

      ws.onmessage = (ev) => {
        try {
          const msg =
            typeof ev.data === "string" ? JSON.parse(ev.data) : JSON.parse(new TextDecoder().decode(ev.data));
          // support different response shapes
          const detsRaw = msg.result_image ?? msg.detections ?? msg.predictions ?? msg.results ?? [];
          // normalize to Detection[] with bbox [x1,y1,x2,y2]
          const dets: Detection[] = (Array.isArray(detsRaw) ? detsRaw : []).map((d: any) => {
            if (Array.isArray(d.bbox) && d.bbox.length === 4) return { bbox: d.bbox, label: d.label, confidence: d.confidence };
            // handle [x,y,w,h] -> convert to [x1,y1,x2,y2]
            if (Array.isArray(d.bbox) && d.bbox.length === 4 && d.bbox[2] <= 1) return { bbox: d.bbox, label: d.label, confidence: d.confidence };
            if (d.x !== undefined && d.y !== undefined && d.w !== undefined && d.h !== undefined) {
              const x1 = d.x, y1 = d.y, x2 = d.x + d.w, y2 = d.y + d.h;
              return { bbox: [x1, y1, x2, y2], label: d.label, confidence: d.score ?? d.confidence };
            }
            return { bbox: d.bbox ?? [0, 0, 0, 0], label: d.label, confidence: d.confidence };
          });
          setDetections(dets);
        } catch (e) {
          console.warn("WS message parse error", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // reconnect after delay
        if (mounted) setTimeout(startWebSocket, 1000);
      };

      ws.onerror = () => {
        setIsConnected(false);
        setError("Lỗi kết nối WebSocket. Đang thử kết nối lại...");
        try { ws.close(); } catch {}
      };
    }

    function sendFrame() {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      const w = video.videoWidth, h = video.videoHeight;
      if (!w || !h) return;
      const off = document.createElement("canvas");
      off.width = w; off.height = h;
      const ctx = off.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);
      off.toBlob((blob) => {
        if (!blob) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          try { 
            wsRef.current?.send(JSON.stringify({ image: dataUrl })); 
            // Update FPS
            frameCountRef.current++;
            const now = Date.now();
            if (now - lastFpsUpdateRef.current >= 1000) {
              setFps(frameCountRef.current);
              frameCountRef.current = 0;
              lastFpsUpdateRef.current = now;
            }
          } catch (e) { console.warn("send error", e); }
        };
        reader.readAsDataURL(blob);
      }, "image/jpeg", 0.6);
    }

    startCamera();

    return () => {
      mounted = false;
      if (sendInterval) { clearInterval(sendInterval); sendInterval = null; }
      if (wsRef.current) try { wsRef.current.close(); } catch {}
      const v = videoRef.current;
      if (v && v.srcObject) { (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop()); v.srcObject = null; }
    };
  }, []);

  // draw detections when they change or on resize/video load
  useEffect(() => {
    function draw() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // size canvas to displayed video size
      const displayW = video.clientWidth || 640;
      const displayH = video.clientHeight || 480;
      canvas.width = displayW;
      canvas.height = displayH;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!detections || detections.length === 0) return;

      // video natural/pixel size for scaling
      const natW = video.videoWidth || displayW;
      const natH = video.videoHeight || displayH;
      const scaleX = displayW / natW;
      const scaleY = displayH / natH;

      detections.forEach((d) => {
        const [x1, y1, x2, y2] = d.bbox;
        // if values are normalized [0..1], convert to pixels
        const isNormalized = Math.max(x1, y1, x2, y2) <= 1;
        let px1 = x1, py1 = y1, px2 = x2, py2 = y2;
        if (isNormalized) {
          px1 = x1 * natW; py1 = y1 * natH; px2 = x2 * natW; py2 = y2 * natH;
        }
        const x = px1 * scaleX;
        const y = py1 * scaleY;
        const w = (px2 - px1) * scaleX;
        const h = (py2 - py1) * scaleY;

        // Color based on label
        let color = "#10b981"; // with_mask - green
        if (d.label === "without_mask") color = "#ef4444"; // red
        if (d.label === "mask_weared_incorrect") color = "#f59e0b"; // orange

        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(3, Math.round(Math.min(displayW, displayH) * 0.003));
        ctx.strokeRect(x, y, w, h);

        const label = d.label ? `${d.label}${d.confidence ? ` ${(d.confidence * 100).toFixed(0)}%` : ""}` : (d.confidence ? `${(d.confidence * 100).toFixed(0)}%` : "");
        if (label) {
          ctx.font = "bold 16px Inter, sans-serif";
          const pad = 8;
          const tw = ctx.measureText(label).width;
          const lx = Math.max(0, x);
          const ly = Math.max(20, y - 8);
          ctx.fillStyle = color;
          ctx.fillRect(lx, ly - 20, tw + pad * 2, 22);
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(label, lx + pad, ly - 9);
        }
      });
    }

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [detections]);

  // Calculate stats
  const stats = detections?.reduce((acc, d) => {
    const label = d.label || "unknown";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className={styles.title}>Webcam Real-Time Detection</h2>
        <p className={styles.subtitle}>Phát hiện khẩu trang trực tiếp từ camera của bạn</p>
      </div>

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <div className={`${styles.statusItem} ${isConnected ? styles.statusConnected : styles.statusDisconnected}`}>
          <div className={styles.statusDot}></div>
          <span>{isConnected ? "Đã kết nối" : "Đang kết nối..."}</span>
        </div>
        {fps > 0 && (
          <div className={styles.statusItem}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>{fps} FPS</span>
          </div>
        )}
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

      {/* Video Container */}
      <div className={styles.videoWrapper}>
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
            <span>Đang khởi động camera...</span>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={styles.video}
        />
        <canvas
          ref={canvasRef}
          className={styles.overlay}
        />
      </div>

      {/* Stats Section */}
      {detections && detections.length > 0 && (
        <div className={styles.statsSection}>
          <h3 className={styles.statsTitle}>Thống kê phát hiện</h3>
          <div className={styles.stats}>
            <div className={`${styles.statItem} ${styles.statSuccess}`}>
              <div className={styles.statIcon}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <strong>{stats["with_mask"] || 0}</strong>
              <span>Đeo đúng</span>
            </div>
            <div className={`${styles.statItem} ${styles.statDanger}`}>
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
            <div className={`${styles.statItem} ${styles.statWarning}`}>
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