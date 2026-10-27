"use client";

import { useMemo, useState } from "react";
import { BRANCHES, DOMAINS, YEARS, type Application } from "@/lib/fields";
import Alert from "../Alert";
import Select from "../Select";
import AdminShell, { adminFetch } from "./AdminShell";

type Row = Application & { createdAt: string; files: { id: string; name: string }[] };
type GroupBy = "year" | "domain" | "branch" | "none";

const short = (s: string) => s.split(" — ")[0].split(" (")[0];
const GROUPS = [
  { value: "year", label: "Tables by year" },
  { value: "domain", label: "Tables by domain" },
  { value: "branch", label: "Tables by branch" },
  { value: "none", label: "One table" },
];
const SORTS = [
  { value: "new", label: "Newest first" },
  { value: "old", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
];
const SORTERS: Record<string, (a: Row, b: Row) => number> = {
  new: (a, b) => b.createdAt.localeCompare(a.createdAt),
  old: (a, b) => a.createdAt.localeCompare(b.createdAt),
  name: (a, b) => a.name.localeCompare(b.name),
};

const COLUMNS: [string, (r: Row) => string][] = [
  ["Submitted", (r) => new Date(r.createdAt).toLocaleString("en-IN")],
  ["Name", (r) => r.name],
  ["Email", (r) => r.email],
  ["Phone", (r) => r.phone],
  ["Enrollment", (r) => r.enrollment],
  ["Branch", (r) => short(r.branch)],
  ["Year", (r) => short(r.year)],
  ["GitHub", (r) => r.github],
  ["LinkedIn", (r) => r.linkedin],
  ["Domains", (r) => r.domains.join(", ")],
  ["Past work", (r) => r.experience],
  ["Files", (r) => (r.files ?? []).map((f) => f.name).join(", ")],
  ["Why MATRIX", (r) => r.why],
];

// Prefix cells Excel would run as formulas (CSV injection), and add a BOM so Excel reads UTF-8.
function downloadCsv(title: string, rows: Row[]) {
  const cell = (v: string) => `"${(/^[=+\-@\t\r]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;
  const text = [COLUMNS.map(([h]) => cell(h)), ...rows.map((r) => COLUMNS.map(([, get]) => cell(get(r))))].map((l) => l.join(",")).join("\r\n");
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" })),
    download: `matrix-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function ApplicationsPage() {
  return <AdminShell<Row[]> url="/api/admin">{(rows) => <Board rows={rows} />}</AdminShell>;
}

function Board({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [year, setYear] = useState("");
  const [domain, setDomain] = useState("");
  const [branch, setBranch] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("year");
  const [sort, setSort] = useState("new");
  const [error, setError] = useState("");

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows
      .filter(
        (r) =>
          (!year || r.year === year) &&
          (!domain || r.domains.includes(domain)) &&
          (!branch || r.branch === branch) &&
          (!s || [r.name, r.email, r.enrollment, r.phone, r.branch].some((v) => v.toLowerCase().includes(s))),
      )
      .sort(SORTERS[sort]);
  }, [rows, q, year, domain, branch, sort]);

  const groups = useMemo(() => {
    if (groupBy === "none") return [{ title: "All applications", rows: shown }];
    if (groupBy === "year") return YEARS.map((y) => ({ title: short(y), rows: shown.filter((r) => r.year === y) }));
    // Someone who picked several domains appears in each of those tables.
    if (groupBy === "domain") return DOMAINS.map((d) => ({ title: d, rows: shown.filter((r) => r.domains.includes(d)) }));
    return BRANCHES.map((b) => ({ title: b, rows: shown.filter((r) => r.branch === b) })).filter((g) => g.rows.length);
  }, [shown, groupBy]);

  async function download(id: string, name: string) {
    setError("");
    const res = await adminFetch(`/api/admin/files/${id}`);
    if (!res.ok) return setError(`Could not download ${name}. Try again.`);
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(await res.blob()), download: name });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const filtered = q || year || domain || branch;
  const counts = [
    { label: "Total", value: rows.length },
    ...YEARS.map((y) => ({ label: short(y), value: rows.filter((r) => r.year === y).length })),
    ...DOMAINS.map((d) => ({ label: d, value: rows.filter((r) => r.domains.includes(d)).length })),
  ];

  return (
    <>
      <div className="admin-head">
        <div>
          <h2>Applications</h2>
          <p>{filtered ? `Showing ${shown.length} of ${rows.length}` : `${rows.length} total`}</p>
        </div>
        <button className="btn small line" disabled={!shown.length} onClick={() => downloadCsv("all", shown)}>
          Export all as CSV
        </button>
      </div>

      <dl className="counts">
        {counts.map((c) => (
          <div key={c.label}>
            <dt>{c.label}</dt>
            <dd>{c.value}</dd>
          </div>
        ))}
      </dl>

      <div className="toolbar">
        <input type="text" placeholder="Search name, email, enrollment, phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        <Select ariaLabel="Filter by year" placeholder="All years" value={year} onChange={setYear} options={[{ value: "", label: "All years" }, ...YEARS]} />
        <Select ariaLabel="Filter by domain" placeholder="All domains" value={domain} onChange={setDomain} options={[{ value: "", label: "All domains" }, ...DOMAINS]} />
        <Select ariaLabel="Filter by branch" placeholder="All branches" value={branch} onChange={setBranch} options={[{ value: "", label: "All branches" }, ...BRANCHES]} />
        <Select ariaLabel="Group into tables" placeholder="Tables by year" value={groupBy} onChange={(v) => setGroupBy(v as GroupBy)} options={GROUPS} />
        <Select ariaLabel="Sort" placeholder="Newest first" value={sort} onChange={setSort} options={SORTS} />
        {filtered && (
          <button
            className="btn small line"
            onClick={() => {
              setQ("");
              setYear("");
              setDomain("");
              setBranch("");
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}

      {groups.map((g) => (
        <section className="group" key={g.title}>
          <div className="group-head">
            <h3>
              {g.title} <span>{g.rows.length}</span>
            </h3>
            <button className="btn small line" disabled={!g.rows.length} onClick={() => downloadCsv(g.title, g.rows)}>
              Export CSV
            </button>
          </div>
          <Table rows={g.rows} empty={rows.length ? "No applications match these filters." : "No applications yet. Share the site to get the first one."} onFile={download} />
        </section>
      ))}
    </>
  );
}

function Table({ rows, empty, onFile }: { rows: Row[]; empty: string; onFile: (id: string, name: string) => void }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Submitted</th><th>Name</th><th>Email</th><th>Phone</th><th>Enrollment</th>
            <th>Branch</th><th>Year</th><th>Profiles</th><th>Domains</th><th>Past work</th><th>Why MATRIX</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.email}>
              <td className="nowrap">{new Date(r.createdAt).toLocaleString("en-IN")}</td>
              <td>{r.name}</td>
              <td><a href={`mailto:${r.email}`}>{r.email}</a></td>
              <td><a href={`https://wa.me/91${r.phone}`} target="_blank" rel="noreferrer">{r.phone}</a></td>
              <td>{r.enrollment}</td>
              <td>{short(r.branch)}</td>
              <td>{short(r.year)}</td>
              <td className="nowrap">
                {r.github && <div><a href={r.github} target="_blank" rel="noreferrer">GitHub</a></div>}
                {r.linkedin && <div><a href={r.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></div>}
              </td>
              <td>{r.domains.join(", ")}</td>
              <td className="why">
                {r.experience}
                {r.files?.length > 0 && (
                  <div className="files">
                    {r.files.map((f) => (
                      <button key={f.id} className="file-link" onClick={() => onFile(f.id, f.name)}>{f.name}</button>
                    ))}
                  </div>
                )}
              </td>
              <td className="why">{r.why}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={11} className="empty">{empty}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
