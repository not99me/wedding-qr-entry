"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./guard.module.css";

export default function GuardPage() {
  const [state, setState] = useState("idle");
  const [lastCode, setLastCode] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const scannerRef = useRef(null);
  const busyRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
    }
  }, []);

  const handleDecoded = useCallback(
    async () => {
      if (busyRef.current) return;

      busyRef.current = true;

      const code = "WEDDING-2026-FN";

      setLastCode(code);
      setState("checking");

      await stopScanner();

      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (data.result === "GRANTED") {
          setState("granted");
        } else if (data.result === "ALREADY_USED") {
          setState("already_used");
        } else {
          setState("denied");
        }
      } catch {
        setErrorDetail("Could not reach the server.");
        setState("denied");
      }
    },
    [stopScanner]
  );

  const startScanner = useCallback(async () => {
    setState("idle");
    setErrorDetail("");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: 250,
        },
        () => {
          handleDecoded();
        },
        () => {}
      );

      busyRef.current = false;
      setState("scanning");
    } catch (err) {
      setErrorDetail(err?.message || "Camera access was blocked.");
      setState("camera_error");
    }
  }, [handleDecoded]);

  useEffect(() => {
    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [startScanner]);

  const scanNext = () => {
    busyRef.current = false;
    startScanner();
  };

  if (state === "granted") {
    return (
      <ResultScreen
        tone="granted"
        icon="check"
        heading="ACCESS GRANTED"
        sub="LET GUEST IN"
        code={lastCode}
        onNext={scanNext}
      />
    );
  }

  if (state === "already_used") {
    return (
      <ResultScreen
        tone="caution"
        icon="warn"
        heading="ALREADY USED"
        sub="DO NOT LET IN"
        code={lastCode}
        onNext={scanNext}
      />
    );
  }

  if (state === "denied") {
    return (
      <ResultScreen
        tone="denied"
        icon="cross"
        heading="ACCESS DENIED"
        sub={errorDetail || "INVALID CODE — DO NOT LET IN"}
        code={lastCode}
        onNext={scanNext}
      />
    );
  }

  if (state === "camera_error") {
    return (
      <main className={styles.wrap}>
        <p className={styles.eyebrow}>Wedding entry</p>

        <h1 className={styles.title}>
          Camera access required
        </h1>

        <p className={styles.helpText}>
          Please allow camera access, then try again.
        </p>

        {errorDetail && (
          <p className={styles.errDetail}>
            {errorDetail}
          </p>
        )}

        <button className={styles.retryBtn} onClick={scanNext}>
          Try again
        </button>
      </main>
    );
  }

  return (
    <main className={styles.wrap}>
      <p className={styles.eyebrow}>Wedding entry</p>

      <h1 className={styles.title}>
        Scan QR code
      </h1>

      <div className={styles.scannerFrame}>
        <div id="qr-reader" className={styles.scannerBox} />

        <span className={`${styles.corner} ${styles.tl}`} />
        <span className={`${styles.corner} ${styles.tr}`} />
        <span className={`${styles.corner} ${styles.bl}`} />
        <span className={`${styles.corner} ${styles.br}`} />

        {state === "scanning" && (
          <span className={styles.scanLine} />
        )}
      </div>

      <p className={styles.helpText}>
        {state === "checking"
          ? "Checking ticket…"
          : "Point the camera at the wedding QR code"}
      </p>
    </main>
  );
}

function ResultScreen({
  tone,
  icon,
  heading,
  sub,
  code,
  onNext,
}) {
  return (
    <main className={`${styles.result} ${styles[tone]}`}>
      <div className={styles.resultIcon}>
        {icon === "check"
          ? "✓"
          : icon === "warn"
          ? "⚠"
          : "✕"}
      </div>

      <h1 className={styles.resultHeading}>
        {heading}
      </h1>

      <p className={styles.resultSub}>{sub}</p>

      {code && (
        <p className={styles.resultCode}>{code}</p>
      )}

      <button className={styles.nextBtn} onClick={onNext}>
        Scan next
      </button>
    </main>
  );
}
