"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./guard.module.css";

const WEDDING_CODE = "WEDDING-2026-FN";

export default function GuardPage() {
  const [state, setState] = useState("idle");
  const [lastCode, setLastCode] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const scannerRef = useRef(null);
  const containerId = "qr-reader";
  const busyRef = useRef(false);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;

    if (scanner) {
      try {
        await scanner.stop();
      } catch {
        // Already stopped.
      }
    }
  }, []);

  const handleDecoded = useCallback(
    async () => {
      if (busyRef.current) return;

      busyRef.current = true;

      const code = WEDDING_CODE;

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
        setErrorDetail("Could not reach the server. Check your connection.");
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
        scannerRef.current = new Html5Qrcode(containerId, {
          verbose: false,
        });
      }

      const scanner = scannerRef.current;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const size = Math.floor(
              Math.min(viewfinderWidth, viewfinderHeight) * 0.7
            );

            return {
              width: size,
              height: size,
            };
          },
        },
        () => {
          handleDecoded();
        },
        () => {
          // No QR found in this frame.
        }
      );

      busyRef.current = false;
      setState("scanning");
    } catch (err) {
      setErrorDetail(
        err?.message || "Camera access was blocked."
      );
      setState("camera_error");
    }
  }, [handleDecoded]);

  useEffect(() => {
    startScanner();

    return () => {
      const scanner = scannerRef.current;

      if (scanner) {
        scanner.stop().catch(() => {});
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
        sub={
          errorDetail
            ? errorDetail
            : "INVALID CODE — DO NOT LET IN"
        }
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
          Please allow camera access in your browser settings,
          then try again.
        </p>

        {errorDetail && (
          <p className={styles.errDetail}>
            {errorDetail}
          </p>
        )}

        <button
          className={styles.retryBtn}
          onClick={scanNext}
        >
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
        <div
          id={containerId}
          className={styles.scannerBox}
        />

        <span
          className={`${styles.corner} ${styles.tl}`}
        />

        <span
          className={`${styles.corner} ${styles.tr}`}
        />

        <span
          className={`${styles.corner} ${styles.bl}`}
        />

        <span
          className={`${styles.corner} ${styles.br}`}
        />

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
    <main
      className={`${styles.result} ${styles[tone]}`}
    >
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

      <p className={styles.resultSub}>
        {sub}
      </p>

      {code && (
        <p className={styles.resultCode}>
          {code}
        </p>
      )}

      <button
        className={styles.nextBtn}
        onClick={onNext}
      >
        Scan next
      </button>
    </main>
  );
}    await stopScanner();

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.result === "GRANTED") setState("granted");
      else if (data.result === "ALREADY_USED") setState("already_used");
      else setState("denied");
    } catch {
      setErrorDetail("Could not reach the server. Check your connection.");
      setState("denied");
    }
  }, [stopScanner]);

  const startScanner = useCallback(async () => {
    setState("idle");
    setErrorDetail("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId, {
          verbose: false,
        });
      }
      const scanner = scannerRef.current;
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.7);
            return { width: size, height: size };
          },
        },
        (decodedText) => {
          handleDecoded(decodedText);
        },
        () => {
          // per-frame "no code found" callback — expected constantly, ignore
        }
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
      const scanner = scannerRef.current;
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        sub={errorDetail ? errorDetail : "INVALID CODE — DO NOT LET IN"}
        code={lastCode}
        onNext={scanNext}
      />
    );
  }

  if (state === "camera_error") {
    return (
      <main className={styles.wrap}>
        <p className={styles.eyebrow}>Wedding entry</p>
        <h1 className={styles.title}>Camera access required</h1>
        <p className={styles.helpText}>
          Please allow camera access in your browser settings, then try
          again.
        </p>
        {errorDetail && <p className={styles.errDetail}>{errorDetail}</p>}
        <button className={styles.retryBtn} onClick={scanNext}>
          Try again
        </button>
      </main>
    );
  }

  return (
    <main className={styles.wrap}>
      <p className={styles.eyebrow}>Wedding entry</p>
      <h1 className={styles.title}>Scan QR code</h1>
      <div className={styles.scannerFrame}>
        <div id={containerId} className={styles.scannerBox} />
        <span className={`${styles.corner} ${styles.tl}`} />
        <span className={`${styles.corner} ${styles.tr}`} />
        <span className={`${styles.corner} ${styles.bl}`} />
        <span className={`${styles.corner} ${styles.br}`} />
        {state === "scanning" && <span className={styles.scanLine} />}
      </div>
      <p className={styles.helpText}>
        {state === "checking" ? "Checking ticket…" : "Point the camera at the guest's ticket"}
      </p>
    </main>
  );
}

function ResultScreen({ tone, icon, heading, sub, code, onNext }) {
  return (
    <main className={`${styles.result} ${styles[tone]}`}>
      <div className={styles.resultIcon}>{icon === "check" ? "✓" : icon === "warn" ? "⚠" : "✕"}</div>
      <h1 className={styles.resultHeading}>{heading}</h1>
      <p className={styles.resultSub}>{sub}</p>
      {code && <p className={styles.resultCode}>{code}</p>}
      <button className={styles.nextBtn} onClick={onNext}>
        Scan next
      </button>
    </main>
  );
}
