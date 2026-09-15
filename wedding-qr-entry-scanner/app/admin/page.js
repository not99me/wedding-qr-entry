"use client";

import { useState } from "react";

export default function AdminPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function addNewInvitations() {
    setLoading(true);
    setMessage("");

    try {
      let added = 0;
      let existing = 0;

      // Add ONLY WED-251 through WED-260
      for (let i = 251; i <= 260; i++) {
        const code = `WED-${String(i).padStart(3, "0")}`;

        const response = await fetch("/api/admin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Could not add ${code}.`);
        }

        if (data.added) {
          added++;
        } else {
          existing++;
        }
      }

      setMessage(
        `✅ Done! ${added} new invitations added. ${existing} already existed.`
      );
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

      <p>
        Add the 10 new wedding invitations:
        <br />
        <strong>WED-251 to WED-260</strong>
      </p>

      <button
        onClick={addNewInvitations}
        disabled={loading}
        style={{
          padding: "15px 25px",
          fontSize: 18,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading
          ? "Adding Invitations..."
          : "Add 10 New Invitations"}
      </button>

      {message && (
        <p
          style={{
            marginTop: 25,
            fontSize: 16,
          }}
        >
          {message}
        </p>
      )}
    </main>
  );
}
