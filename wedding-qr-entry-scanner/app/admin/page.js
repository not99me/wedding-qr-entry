"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./admin.module.css";

const SESSION_KEY = "wedding_admin_secret";

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? sessionStorage.getItem(SESSION_KEY) : null;
    if (stored) {
      verifySecret(stored).then((ok) => {
        if (ok) {
          setSecret(stored);
          setAuthed(true);
        }
        setChecking(false);
      });
    } else {
      setChecking(false);
    }
  }, []);

  async function verifySecret(value) {
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-secret": value },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError("");
    const ok = await verifySecret(secret);
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, secret);
      setAuthed(true);
    } else {
      setAuthError("Incorrect admin key.");
    }
  }

  if (checking) return null;

  if (!authed) {
    return (
      <main className={styles.loginWrap}>
        <form className={styles.loginCard} onSubmit={handleLogin}>
          <p className={styles.eyebrow}>Admin panel</p>
          <h1 className={styles.loginTitle}>Enter admin key</h1>
          <input
            type="password"
            className={styles.loginInput}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Admin secret"
            autoFocus
          />
          {authError && <p className={styles.err}>{authError}</p>}
          <button type="submit" className={styles.loginBtn}>
            Unlock
          </button>
        </form>
      </main>
    );
  }

  return <Dashboard secret={secret} />;
}

function Dashboard({ secret }) {
  const [stats, setStats] = useState(null);
  const [codes, setCodes] = useState([]);
  const [history, setHistory] = useState([]);
  const [newCode, setNewCode] = useState("");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("codes");

  const headers = { "x-admin-secret": secret, "Content-Type": "application/json" };

  const refreshAll = useCallback(async () => {
    const [statsRes, codesRes, historyRes] = await Promise.all([
      fetch("/api/admin/stats", { headers }),
      fetch("/api/admin/codes", { headers }),
      fetch("/api/admin/history", { headers }),
    ]);
    if (statsRes.ok) setStats(await statsRes.json());
    if (codesRes.ok) setCodes((await codesRes.json()).codes);
    if (historyRes.ok) setHistory((await historyRes.json()).events);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret]);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 8000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  async function addCode(e) {
    e.preventDefault();
    const code = newCode.trim();
    if (!code) return;
    const res = await fetch("/api/admin/codes", {
      method: "POST",
      headers,
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setMessage(data.added ? `Added ${code}` : `${code} already existed`);
    setNewCode("");
    refreshAll();
  }

  async function removeCode(code) {
    await fetch("/api/admin/codes", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ code }),
    });
    setMessage(`Removed ${code}`);
    refreshAll();
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "x-admin-secret": secret },
      body: formData,
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(`Imported ${data.imported} codes (${data.newlyAdded} new)`);
    } else {
      setMessage(data.error || "Import failed");
    }
    e.target.value = "";
    refreshAll();
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  }

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Admin panel</p>
          <h1 className={styles.h1}>Wedding entry</h1>
        </div>
        <button className={styles.logoutBtn} onClick={logout}>
          Log out
        </button>
      </header>

      <section className={styles.statsGrid}>
        <StatCard label="Total codes" value={stats?.total ?? "—"} />
        <StatCard label="Used" value={stats?.used ?? "—"} accent="granted" />
        <StatCard label="Remaining" value={stats?.remaining ?? "—"} accent="blue" />
        <StatCard label="Invalid scans" value={stats?.invalidScans ?? "—"} accent="denied" />
      </section>

      <nav className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${tab === "codes" ? styles.tabActive : ""}`}
          onClick={() => setTab("codes")}
        >
          Codes
        </button>
        <button
          className={`${styles.tabBtn} ${tab === "history" ? styles.tabActive : ""}`}
          onClick={() => setTab("history")}
        >
          Check-in history
        </button>
      </nav>

      {message && <p className={styles.message}>{message}</p>}

      {tab === "codes" && (
        <section className={styles.panel}>
          <form className={styles.addRow} onSubmit={addCode}>
            <input
              className={styles.input}
              placeholder="e.g. WED-7K92XQ4P"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
            />
            <button className={styles.addBtn} type="submit">
              Add code
            </button>
          </form>

          <label className={styles.importRow}>
            <span>Import CSV of codes</span>
            <input type="file" accept=".csv,text/csv,text/plain" onChange={handleFile} />
          </label>

          <div className={styles.codeList}>
            {codes.length === 0 && <p className={styles.empty}>No codes registered yet.</p>}
            {codes.map(({ code, used }) => (
              <div className={styles.codeRow} key={code}>
                <span className={styles.codeText}>{code}</span>
                <span className={`${styles.badge} ${used ? styles.badgeUsed : styles.badgeUnused}`}>
                  {used ? "Used" : "Unused"}
                </span>
                <button className={styles.removeBtn} onClick={() => removeCode(code)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "history" && (
        <section className={styles.panel}>
          <div className={styles.historyTable}>
            <div className={`${styles.historyRow} ${styles.historyHead}`}>
              <span>Code</span>
              <span>Result</span>
              <span>Time</span>
            </div>
            {history.length === 0 && <p className={styles.empty}>No scans yet.</p>}
            {history.map((event, i) => (
              <div className={styles.historyRow} key={i}>
                <span className={styles.codeText}>{event.code}</span>
                <span className={resultClass(event.result, styles)}>{formatResult(event.result)}</span>
                <span className={styles.time}>{new Date(event.time).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`${styles.statCard} ${accent ? styles["accent_" + accent] : ""}`}>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  );
}

function formatResult(result) {
  if (result === "ACCEPTED") return "Accepted";
  if (result === "ALREADY_USED") return "Already used";
  return "Invalid";
}

function resultClass(result, styles) {
  if (result === "ACCEPTED") return styles.resultGranted;
  if (result === "ALREADY_USED") return styles.resultCaution;
  return styles.resultDenied;
}
