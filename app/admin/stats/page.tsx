"use client";

import { FIELDS, type Stats } from "@/lib/track";
import AdminShell from "../AdminShell";

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const dur = (ms: number) => {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
};
const ago = (d: string | Date) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};

// devLinkedin is only sent for the master key.
type StatsData = Omit<Stats, "devLinkedin"> & { devLinkedin?: Stats["devLinkedin"] };

export default function StatsPage() {
  return <AdminShell<StatsData> url="/api/admin/stats">{(s) => <Dashboard s={s} />}</AdminShell>;
}

function Dashboard({ s }: { s: StatsData }) {
  const t = s.totals;
  return (
    <>
      <div className="admin-head">
        <div>
          <h2>Visitor stats</h2>
          <p>Last 90 days. A started form counts as left half-filled after 30 minutes with no submit.</p>
        </div>
      </div>

      {!t.sessions ? (
        <p className="panel empty-panel">No visits recorded yet. Numbers appear here once people open the site.</p>
      ) : (
        <>
          <div className="tiles">
            <Tile label="Visits" value={String(t.sessions)} />
            <Tile label="Started the form" value={String(t.started)} sub={`${pct(t.started, t.sessions)}% of visits`} />
            <Tile label="Submitted" value={String(t.submitted)} sub={`${pct(t.submitted, t.started)}% of those who started`} />
            <Tile label="Left half-filled" value={String(t.abandoned)} sub={`${pct(t.abandoned, t.started)}% of those who started`} />
            <Tile label="Avg. time on site" value={dur(t.avgActiveMs)} sub={`Median ${dur(t.medianActiveMs)}`} />
          </div>

          {s.devLinkedin && <LinkedinPanel d={s.devLinkedin} />}

          <Panel title="Visits per day" note="Last 14 days, India time. Hover a bar for details.">
            <DayChart days={s.daily} />
          </Panel>

          <div className="panels">
            <Panel title="Where visitors come from">
              <Breakdown rows={s.sources} />
            </Panel>
            <Panel title="Devices">
              <Breakdown rows={s.devices} />
            </Panel>
          </div>

          <div className="panels">
            <Panel title="How far down the page people get">
              <Bars rows={[{ label: "Opened the site", count: t.sessions }, ...s.sections]} total={t.sessions} />
            </Panel>
            <Panel title="Form fields answered" note="Out of visitors who started the form. A drop shows where people stop.">
              <Bars rows={s.fields} total={t.started} />
            </Panel>
          </div>

          <Panel title="Left half-filled" note="Latest 50. Only which fields were answered is stored, never what was typed.">
            {s.abandoned.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Last seen</th><th>Source</th><th>Device</th><th>Time on site</th><th>Fields answered</th><th>Stopped after</th><th>Scrolled</th><th>Last error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.abandoned.map((a, i) => (
                      <tr key={i}>
                        <td className="nowrap">{ago(a.lastSeen)}</td>
                        <td>{a.source}</td>
                        <td>{a.device}</td>
                        <td>{dur(a.activeMs)}</td>
                        <td>{a.filled} of {FIELDS.length}</td>
                        <td>{a.lastField || "Nothing yet"}</td>
                        <td>{a.maxScroll}%</td>
                        <td>{a.lastError}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">Nobody has left the form half-filled.</p>
            )}
          </Panel>
        </>
      )}

      <p className="muted tip">
        To see which post or group brought people in, share links with a source tag, like{" "}
        <code>?utm_source=whatsapp</code> or <code>?utm_source=instagram&amp;utm_campaign=story</code>. Instagram, LinkedIn and
        Facebook app traffic is detected automatically.
      </p>
    </>
  );
}

// Master key only: clicks on "Developed by Garvit Dayal" in the footer.
function LinkedinPanel({ d }: { d: Stats["devLinkedin"] }) {
  return (
    <Panel
      title="Your LinkedIn clicks"
      note={`${d.clicks} ${d.clicks === 1 ? "click" : "clicks"} from ${d.visitors} ${d.visitors === 1 ? "visitor" : "visitors"} on "Developed by Garvit Dayal" in the footer. Only the master key sees this. Visitors are anonymous unless they also applied.`}
    >
      {d.list.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Last click</th><th>Who</th><th>Source</th><th>Device</th><th>Clicks</th></tr>
            </thead>
            <tbody>
              {d.list.map((c, i) => (
                <tr key={i}>
                  <td className="nowrap">{ago(c.at)}</td>
                  <td>{c.applicant || <span className="muted">Anonymous visitor</span>}</td>
                  <td className="cap">{c.source}</td>
                  <td className="cap">{c.device}</td>
                  <td>{c.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">No clicks yet.</p>
      )}
    </Panel>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="tile">
      <p>{label}</p>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  );
}

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      {note && <p className="muted">{note}</p>}
      {children}
    </section>
  );
}

// Single-series horizontal bars; the share of `total` is printed beside each bar.
function Bars({ rows, total }: { rows: { label: string; count: number }[]; total: number }) {
  return (
    <ul className="hbars">
      {rows.map((r) => (
        <li key={r.label}>
          <span>{r.label}</span>
          <span className="track"><span style={{ width: `${pct(r.count, total)}%` }} /></span>
          <span className="val">{r.count} <small>{pct(r.count, total)}%</small></span>
        </li>
      ))}
    </ul>
  );
}

function Breakdown({ rows }: { rows: { key: string; sessions: number; started: number; submitted: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.sessions));
  return (
    <table className="breakdown">
      <thead>
        <tr><th>Name</th><th>Visits</th><th>Started</th><th>Submitted</th></tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <td className="cap">{r.key}</td>
            <td>
              <span className="cell-bar"><span style={{ width: `${(r.sessions / max) * 100}%` }} /></span>
              {r.sessions}
            </td>
            <td>{r.started}</td>
            <td>{r.submitted} <small className="muted">{pct(r.submitted, r.sessions)}%</small></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DayChart({ days }: { days: Stats["daily"] }) {
  const max = Math.max(1, ...days.map((d) => d.sessions));
  const label = (day: string) => new Date(day + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return (
    <div className="daychart">
      <span className="axis-max">{max}</span>
      <div className="days" role="list">
        {days.map((d, i) => (
          <div
            key={d.day}
            className="day"
            role="listitem"
            tabIndex={0}
            aria-label={`${label(d.day)}: ${d.sessions} visits, ${d.submitted} submitted`}
          >
            {d.sessions > 0 && <span className="bar" style={{ height: `max(3px, ${(d.sessions / max) * 100}%)` }} />}
            <span className="tip-box">
              <b>{label(d.day)}</b>
              {d.sessions} visits
              <br />
              {d.submitted} submitted
            </span>
            {(days.length - 1 - i) % 3 === 0 && <span className="x">{label(d.day)}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
