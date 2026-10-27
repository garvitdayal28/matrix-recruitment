"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Alert from "../Alert";
import Mark from "../Mark";

const KEY = "matrix-admin-key";
export const adminKey = () => sessionStorage.getItem(KEY) ?? "";
export const adminFetch = (url: string, key = adminKey()) => fetch(url, { headers: { "x-admin-key": key }, cache: "no-store" });

const TABS = [
  { href: "/admin", label: "Applications" },
  { href: "/admin/stats", label: "Visitor stats" },
];

// Key login + header shared by the admin pages. `url` is the page's data endpoint.
export default function AdminShell<T>({ url, children }: { url: string; children: (data: T) => React.ReactNode }) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const path = usePathname();

  async function load(key: string) {
    setLoading(true);
    setError("");
    try {
      const res = await adminFetch(url, key);
      if (res.status === 401) {
        sessionStorage.removeItem(KEY);
        setData(null);
        throw new Error("That key is wrong. Check it and try again.");
      }
      if (!res.ok) throw new Error("Could not load data. Try again.");
      setData(await res.json());
      sessionStorage.setItem(KEY, key);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }

  useEffect(() => {
    const saved = adminKey();
    (saved ? load(saved) : Promise.resolve()).finally(() => setBooting(false));
    // Load once per page; `url` is fixed per page.
  }, []);

  if (!data) {
    if (booting) return <p className="wrap admin-loading">Loading…</p>;
    return (
      <form
        className="wrap login"
        onSubmit={(e) => {
          e.preventDefault();
          load(String(new FormData(e.currentTarget).get("key")));
        }}
      >
        <Mark className="mark" />
        <h2>MATRIX admin</h2>
        <p>Enter the admin key to see applications and visitor stats.</p>
        <input type="password" name="key" required autoFocus aria-label="Admin key" />
        {error && <Alert onClose={() => setError("")}>{error}</Alert>}
        <button className="btn" disabled={loading}>
          {loading && <span className="spinner" aria-hidden="true" />}
          {loading ? "Checking…" : "Open panel"}
        </button>
      </form>
    );
  }

  return (
    <main className="wrap admin">
      <header className="nav admin-nav">
        <span className="brand">
          <Mark className="mark" />
          MATRIX
        </span>
        <nav className="admin-tabs" aria-label="Admin pages">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} aria-current={path === t.href ? "page" : undefined}>
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="admin-actions">
          <button className="btn small line" disabled={loading} onClick={() => load(adminKey())}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            className="btn small line"
            onClick={() => {
              sessionStorage.removeItem(KEY);
              setData(null);
            }}
          >
            Log out
          </button>
        </div>
      </header>
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}
      {children(data)}
    </main>
  );
}
