"use client";

import { useEffect, useState } from "react";

export default function RegisterPage() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invitationCode = params.get("code");

    if (invitationCode) {
      setCode(invitationCode.toUpperCase());
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!code || !name.trim()) {
      setMessage("Please enter your name.");
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
          code,
          name: name.trim(),
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
        <div style={styles.smallTitle}>
          WEDDING INVITATION
        </div>

        <h1 style={styles.title}>Register</h1>

        <p style={styles.subtitle}>
          Enter the invitation code you received and your name.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>
            Invitation Code
          </label>

          <input
            type="text"
            value={code}
            readOnly
            placeholder="Your invitation code"
            style={styles.codeInput}
          />

          <label style={styles.label}>
            Your Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            autoComplete="name"
            style={styles.input}
          />

          <button
            type="submit"
            disabled={loading}
            style={styles.button}
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
    fontFamily: "Arial, sans-serif",
    color: "#111111",
  },

  card: {
    width: "100%",
    maxWidth: "440px",
    background: "#ffffff",
    padding: "40px 30px",
    borderRadius: "20px",
    boxShadow: "0 15px 50px rgba(0, 0, 0, 0.08)",
    color: "#111111",
  },

  smallTitle: {
    textAlign: "center",
    fontSize: "12px",
    letterSpacing: "3px",
    color: "#333333",
    marginBottom: "12px",
    fontWeight: "600",
  },

  title: {
    textAlign: "center",
    margin: 0,
    fontSize: "36px",
    fontWeight: "600",
    color: "#111111",
  },

  subtitle: {
    textAlign: "center",
    color: "#333333",
    lineHeight: "1.5",
    margin: "12px 0 30px",
  },

  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "700",
    color: "#111111",
    marginBottom: "8px",
    marginTop: "18px",
  },

  codeInput: {
    width: "100%",
    height: "50px",
    boxSizing: "border-box",
    border: "1px solid #bdbdbd",
    borderRadius: "10px",
    padding: "0 14px",
    fontSize: "16px",
    color: "#111111",
    background: "#eeeeee",
    fontWeight: "600",
  },

  input: {
    width: "100%",
    height: "50px",
    boxSizing: "border-box",
    border: "1px solid #bdbdbd",
    borderRadius: "10px",
    padding: "0 14px",
    fontSize: "16px",
    color: "#111111",
    background: "#ffffff",
    outline: "none",
  },

  button: {
    width: "100%",
    height: "52px",
    marginTop: "26px",
    border: "none",
    borderRadius: "10px",
    background: "#111111",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  message: {
    marginTop: "20px",
    padding: "14px",
    borderRadius: "10px",
    background: "#eeeeee",
    color: "#111111",
    textAlign: "center",
    fontWeight: "600",
  },
};
