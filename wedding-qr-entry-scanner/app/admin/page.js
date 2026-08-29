"use client";

import { useState } from "react";

export default function AdminPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateInvitations() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Something went wrong.");
      }

      setMessage(`✅ ${data.created} invitations created successfully.`);
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
        padding: 30,
        textAlign: "center",
      }}
    >
      <h1>Wedding Admin</h1>

      <p>Generate the 250 wedding invitations.</p>

      <button
        onClick={generateInvitations}
        disabled={loading}
        style={{
          padding: "15px 25px",
          fontSize: 18,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Creating..." : "Generate 250 Invitations"}
      </button>

      {message && (
        <p style={{ marginTop: 25 }}>
          {message}
        </p>
      )}
    </main>
  );
}
