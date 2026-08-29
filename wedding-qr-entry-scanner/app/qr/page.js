"use client";

import { useState } from "react";

export default function QRPage() {
  const [message, setMessage] = useState("");
  const [showCodes, setShowCodes] = useState(false);

  function generate() {
    setShowCodes(true);
    setMessage("✅ 250 QR codes are ready.");
  }

  function printCodes() {
    window.print();
  }

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "";

  const invitations = Array.from({ length: 250 }, (_, index) => {
    const number = index + 1;
    const code = `WED-${String(number).padStart(3, "0")}`;

    const registrationUrl =
      `${origin}/register?code=${code}`;

    const qrUrl =
      `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
        registrationUrl
      )}`;

    return {
      number,
      code,
      registrationUrl,
      qrUrl,
    };
  });

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Wedding QR Codes</h1>

        <p style={styles.subtitle}>
          Generate the 250 unique wedding invitation QR codes.
        </p>

        {!showCodes && (
          <button onClick={generate} style={styles.button}>
            Generate 250 QR Codes
          </button>
        )}

        {message && (
          <p style={styles.successMessage}>
            {message}
          </p>
        )}

        {showCodes && (
          <>
            <button onClick={printCodes} style={styles.button}>
              Print / Save QR Codes
            </button>

            <p style={styles.info}>
              Each QR code opens the registration page
              for its own invitation.
            </p>
          </>
        )}
      </div>

      {showCodes && (
        <div style={styles.grid}>
          {invitations.map((invitation) => (
            <div key={invitation.code} style={styles.card}>
              <img
                src={invitation.qrUrl}
                alt={`QR code ${invitation.code}`}
                style={styles.qr}
              />

              <h2 style={styles.code}>
                {invitation.code}
              </h2>

              <p style={styles.number}>
                Invitation #{invitation.number}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f4ee",
    padding: "40px 20px",
    fontFamily: "Arial, sans-serif",
    color: "#171717",
  },

  header: {
    textAlign: "center",
    marginBottom: "40px",
  },

  title: {
    color: "#171717",
    fontSize: "36px",
    marginBottom: "10px",
  },

  subtitle: {
    color: "#444444",
    fontSize: "16px",
    marginBottom: "25px",
  },

  button: {
    padding: "14px 24px",
    border: "none",
    borderRadius: "10px",
    background: "#171717",
    color: "#ffffff",
    fontSize: "16px",
    cursor: "pointer",
    margin: "10px",
  },

  successMessage: {
    color: "#0a7a35",
    fontWeight: "600",
    marginTop: "15px",
  },

  info: {
    color: "#444444",
    marginTop: "10px",
  },

  grid: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "20px",
  },

  card: {
    background: "#ffffff",
    padding: "20px",
    borderRadius: "15px",
    textAlign: "center",
    boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
    breakInside: "avoid",
    color: "#171717",
  },

  qr: {
    width: "100%",
    maxWidth: "200px",
    height: "auto",
    display: "block",
    margin: "0 auto 15px",
  },

  code: {
    color: "#171717",
    fontSize: "22px",
    margin: "10px 0 5px",
  },

  number: {
    color: "#555555",
    fontSize: "14px",
    margin: 0,
  },
};
