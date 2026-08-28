"use client";

import { useEffect, useRef, useState } from "react";

const CODE = "WEDDING-2026-FN";

export default function GuardPage() {
  const scannerRef = useRef(null);
  const busyRef = useRef(false);

  const [status, setStatus] = useState("starting");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!active) return;

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: 250,
          },
          async (decodedText) => {
            if (!active || busyRef.current) return;

            busyRef.current = true;

            await scanner.stop().catch(() => {});

            const scannedCode = decodedText.trim();

            setStatus("checking");
            setMessage(scannedCode);

            try {
              const response = await fetch("/api/scan", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  code: scannedCode,
                }),
              });

              const data = await response.json();

              if (data.result === "GRANTED") {
                setStatus("granted");
              } else if (data.result === "ALREADY_USED") {
                setStatus("used");
              } else {
                setStatus("denied");
              }
            } catch (error) {
              console.error(error);
              setStatus("error");
              setMessage("Could not connect to the server.");
            }
          },
          () => {}
        );

        if (active) {
          setStatus("scanning");
        }
      } catch (error) {
        console.error(error);

        if (active) {
          setStatus("camera_error");
          setMessage(error?.message || "Could not start camera.");
        }
      }
    }

    startScanner();

    return () => {
      active = false;

      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  if (status === "granted") {
    return (
      <main style={screenStyle("#0a7a35")}>
        <div style={iconStyle}>✓</div>
        <h1>ACCESS GRANTED</h1>
        <p>LET GUEST IN</p>
      </main>
    );
  }

  if (status === "used") {
    return (
      <main style={screenStyle("#b36b00")}>
        <div style={iconStyle}>⚠</div>
        <h1>ALREADY USED</h1>
        <p>DO NOT LET IN</p>
      </main>
    );
  }

  if (status === "denied") {
    return (
      <main style={screenStyle("#b00020")}>
        <div style={iconStyle}>✕</div>
        <h1>ACCESS DENIED</h1>
        <p>INVALID CODE — DO NOT LET IN</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main style={screenStyle("#b00020")}>
        <div style={iconStyle}>✕</div>
        <h1>ERROR</h1>
        <p>{message}</p>
      </main>
    );
  }

  if (status === "camera_error") {
    return (
      <main style={basicStyle}>
        <h1>Camera Error</h1>
        <p>{message}</p>
        <p>Please allow camera access and reload the page.</p>
      </main>
    );
  }

  return (
    <main style={basicStyle}>
      <h1>Wedding Entry</h1>

      <p>
        {status === "checking"
          ? "Checking ticket..."
          : "Point the camera at the QR code"}
      </p>

      <div
        id="qr-reader"
        style={{
          width: "100%",
          maxWidth: "500px",
          margin: "30px auto",
        }}
      />

      {message && <p>{message}</p>}
    </main>
  );
}

const basicStyle = {
  minHeight: "100vh",
  padding: "30px 20px",
  textAlign: "center",
  fontFamily: "Arial, sans-serif",
};

function screenStyle(background) {
  return {
    minHeight: "100vh",
    background,
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    padding: "30px",
  };
}

const iconStyle = {
  fontSize: "90px",
  marginBottom: "20px",
};
