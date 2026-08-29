"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./guard.module.css";

export default function GuardPage() {
  const [state, setState] = useState("idle");
  const [lastCode, setLastCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [errorDetail, setErrorDetail] = useState("");

  const scannerRef = useRef(null);
  const busyRef = useRef(false);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;

    if (!scanner) return;

    try {
      await scanner.stop();
    } catch {
      // Scanner may already be stopped.
    }
  }, []);

  const extractCode = (decodedText) => {
    const value = decodedText.trim();

    // If the QR contains a full registration URL:
    // https://example.com/register?code=WED-219
    try {
      const url = new URL(value);
      const code = url.searchParams.get("code");

      if (code) {
        return code.trim().toUpperCase();
      }
    } catch {
      // Not a URL — continue below.
    }

    // If the QR contains only WED-219
    return value.toUpperCase();
  };

  const handleDecoded = useCallback(
    async (decodedText) => {
      if (busyRef.current) return;

      busyRef.current = true;

      const code = extractCode(decodedText);

      setLastCode(code);
      setGuestName("");
      setState("checking");

      await stopScanner();

      try {
        const response = await fetch("/api/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
          }),
        });

        const data = await response.json();

        console.log("SCAN RESULT:", data);

        if (data.result === "GRANTED") {
          setGuestName(data.name || "");
          setState("granted");
        } else if (data.result === "ALREADY_USED") {
          setGuestName(data.name || "");
          setState("already_used");
        } else if (data.result === "NOT_REGISTERED") {
          setGuestName("");
          setErrorDetail(
            "This guest has not registered yet."
          );
          setState("not_registered");
        } else if (data.result === "INVALID") {
          setErrorDetail(
            data.message || "Invalid invitation code."
          );
          setState("denied");
        } else {
          setErrorDetail(
            data.message || "Something went wrong."
          );
          setState("denied");
        }
      } catch (error) {
        console.error("Scan error:", error);

        setErrorDetail(
          "Could not reach the server. Check your connection."
        );

        setState("denied");
      }
    },
    [stopScanner]
  );

  const startScanner = useCallback(async () => {
    setState("idle");
    setErrorDetail("");
    setLastCode("");
    setGuestName("");

    try {
      const { Html5Qrcode } = await import(
        "html5-qrcode"
      );

      const element =
        document.getElementById("qr-reader");

      if (!element) {
        throw new Error(
          "QR scanner element was not found."
        );
      }

      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // Ignore if already stopped.
        }

        scannerRef.current = null;
      }

      const scanner = new Html5Qrcode("qr-reader", {
        verbose: false,
      });

      scannerRef.current = scanner;

      await scanner.start(
        {
          facingMode: "environment",
        },
        {
          fps: 10,

          qrbox: (
            viewfinderWidth,
            viewfinderHeight
          ) => {
            const size = Math.floor(
              Math.min(
                viewfinderWidth,
                viewfinderHeight
              ) * 0.7
            );

            return {
              width: size,
              height: size,
            };
          },
        },
        (decodedText) => {
          handleDecoded(decodedText);
        },
        () => {
          // No QR detected in this frame.
        }
      );

      busyRef.current = false;
      setState("scanning");
    } catch (error) {
      console.error("Camera error:", error);

      setErrorDetail(
        error?.message ||
          "Camera access was blocked or unavailable."
      );

      setState("camera_error");
    }
  }, [handleDecoded]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      clearTimeout(timer);

      const scanner = scannerRef.current;

      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, [startScanner]);

  const scanNext = async () => {
    busyRef.current = false;

    setState("idle");
    setLastCode("");
    setGuestName("");
    setErrorDetail("");

    await new Promise((resolve) =>
      setTimeout(resolve, 100)
    );

    startScanner();
  };

  if (state === "granted") {
    return (
      <ResultScreen
        tone="granted"
        icon="check"
        heading="ACCESS GRANTED"
        sub="LET GUEST IN"
        name={guestName}
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
        name={guestName}
        code={lastCode}
        onNext={scanNext}
      />
    );
  }

  if (state === "not_registered") {
    return (
      <ResultScreen
        tone="caution"
        icon="warn"
        heading="NOT REGISTERED"
        sub="GUEST MUST REGISTER FIRST"
        name=""
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
          errorDetail ||
          "INVALID CODE — DO NOT LET IN"
        }
        name=""
        code={lastCode}
        onNext={scanNext}
      />
    );
  }

  if (state === "camera_error") {
    return (
      <main className={styles.wrap}>
        <p className={styles.eyebrow}>
          Wedding entry
        </p>

        <h1 className={styles.title}>
          Camera access required
        </h1>

        <p className={styles.helpText}>
          Please allow camera access in your browser
          settings, then try again.
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
      <p className={styles.eyebrow}>
        Wedding entry
      </p>

      <h1 className={styles.title}>
        Scan QR code
      </h1>

      <div className={styles.scannerFrame}>
        <div
          id="qr-reader"
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
          : "Point the camera at the guest's ticket"}
      </p>
    </main>
  );
}

function ResultScreen({
  tone,
  icon,
  heading,
  sub,
  name,
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

      {name && (
        <div className={styles.guestName}>
          {name}
        </div>
      )}

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
}
