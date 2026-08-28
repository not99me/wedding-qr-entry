"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./guard.module.css";

export default function GuardPage() {
  const scannerRef = useRef(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function start() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!mounted) return;

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: 250,
          },
          async (decodedText) => {
            if (!mounted || result) return;

            await scanner.stop();

            try {
              const response = await fetch("/api/scan", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  code: decodedText.trim(),
                }),
              });

              const data = await response.json();

              if (data.result === "GRANTED") {
                setResult("granted");
              } else if (data.result === "ALREADY_USED") {
                setResult("already_used");
              } else {
                setResult("denied");
              }
            } catch {
              setError("Could not contact the server.");
              setResult("denied");
            }
          },
          () => {}
        );
      } catch (err) {
        setError(err?.message || "Could not start camera.");
      }
    }

    start();

    return () => {
      mounted = false;

      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [result]);

  if (result === "granted") {
    return (
      <main className={`${styles.result} ${styles.granted}`}>
        <div className={styles.resultIcon}>✓</div>
        <h1 className={styles.resultHeading}>ACCESS GRANTED</h1>
        <p className={styles.resultSub}>LET GUEST IN</p>
      </main>
    );
  }

  if (result === "already_used") {
    return (
      <main className={`${styles.result} ${styles.caution}`}>
        <div className={styles.resultIcon}>⚠</div>
        <h1 className={styles.resultHeading}>ALREADY USED</h1>
        <p className={styles.resultSub}>DO NOT LET IN</p>
      </main>
    );
  }

  if (result === "denied") {
    return (
      <main className={`${styles.result} ${styles.denied}`}>
        <div className={styles.resultIcon}>✕</div>
        <h1 className={styles.resultHeading}>ACCESS DENIED</h1>
        <p className={styles.resultSub}>
          {error || "INVALID CODE — DO NOT LET IN"}
        </p>
      </main>
    );
  }

  return (
    <main className={styles.wrap}>
      <p className={styles.eyebrow}>Wedding entry</p>

      <h1 className={styles.title}>Scan QR code</h1>

      <div className={styles.scannerFrame}>
        <div id="qr-reader" className={styles.scannerBox} />
      </div>

      {error && (
        <p className={styles.errDetail}>
          {error}
        </p>
      )}

      <p className={styles.helpText}>
        Point the camera at the guest's QR code
      </p>
    </main>
  );
}
