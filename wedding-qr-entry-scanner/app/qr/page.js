"use client";

import { useState } from "react";

export default function QRPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function generateQRs() {
    setLoading(true);
    setMessage("");

    try {
      const QRCode = await import("qrcode");

      const invitations = [];

      for (let i = 1; i <= 250; i++) {
        const code = `WED-${String(i).padStart(3, "0")}`;

        const url =
          `${window.location.origin}/register?code=${code}`;

        const qr = await QRCode.toDataURL(url, {
          width: 500,
          margin: 2,
        });

        invitations.push({
          number: i,
          code,
          url,
          qr,
        });
      }

      localStorage.setItem(
        "wedding-qrs",
        JSON.stringify(invitations)
      );

      setMessage("✅ 250 QR codes generated successfully.");
    } catch (error) {
      console.error(error);
      setMessage(
        "❌ Could not generate QR codes. Make sure the qrcode package is installed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Wedding QR Codes</h1>

      <p>
        Generate the 250 unique wedding invitation QR codes.
      </p>

      <button
        onClick={generateQRs}
        disabled={loading}
        style={{
          padding: "14px 24px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        {loading ? "Generating..." : "Generate 250 QR Codes"}
      </button>

      {message && (
        <p style={{ marginTop: "20px" }}>
          {message}
        </p>
      )}
    </main>
  );
}
