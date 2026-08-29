"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanCode || !cleanName) {
      setMessage("Please enter your invitation code and name.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: cleanCode,
          name: cleanName,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "Registration failed.");
        return;
      }

      setMessage(`Registration successful — ${data.name}`);
      setName("");
    } catch (error) {
      console.error(error);
      setMessage("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.smallTitle}>WEDDING INVITATION</div>

        <h1 style={styles.title}>Register</h1>

        <p style={styles.subtitle}>
          Enter the invitation code you received and your name.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Invitation Code</label>

          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="WED-001"
            autoCapitalize="characters"
            autoComplete="off"
            style={styles.input}
          />

          <label style={styles.label}>Your Name</label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            autoComplete="name"
            style={styles.input}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "REGISTERING..." : "REGISTER"}
          </button>
        </form>

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f4ee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "440px",
    background: "#ffffff",
    padding: "40px 30px",
    borderRadius: "20px",
    boxShadow: "0 15px 50px rgba(0,0,0,0.08)",
    boxSizing: "border-box",
  },

  smallTitle: {
    textAlign: "center",
    fontSize: "12px",
    letterSpacing: "3px",
    color: "#777",
    marginBottom: "12px",
  },

  title: {
    textAlign: "center",
    margin: "0",
    fontSize: "36px",
    fontWeight: "500",
  },

  subtitle: {
    textAlign: "center",
    color: "#777",
    lineHeight: "1.5",
    margin: "12px 0 30px",
  },

  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "8px",
    marginTop: "18px",
  },

  input: {
    width: "100%",
    height: "50px",
    boxSizing: "border-box",
    border: "1px solid #d6d1c8",
    borderRadius: "10px",
    padding: "0 14px",
    fontSize: "16px",
    outline: "none",
  },

  button: {
    width: "100%",
    height: "52px",
    marginTop: "26px",
    border: "none",
    borderRadius: "10px",
    background: "#171717",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    letterSpacing: "1px",
    cursor: "pointer",
  },

  message: {
    marginTop: "20px",
    padding: "14px",
    borderRadius: "10px",
    background: "#f1f1f1",
    textAlign: "center",
    fontSize: "14px",
  },
};
