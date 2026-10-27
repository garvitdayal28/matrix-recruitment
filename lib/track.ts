// Visitor tracking: shared by the client tracker, the /api/track endpoint and the stats page.
export const SECTIONS = ["about", "teams", "events", "apply"];
export const SECTION_LABELS: Record<string, string> = { about: "What we do", teams: "Teams", events: "Events", apply: "Form" };
// Form order, so the stats page reads as a drop-off funnel.
export const FIELDS = [
  { name: "name", label: "Full name" },
  { name: "email", label: "Email" },
  { name: "branch", label: "Branch" },
  { name: "enrollment", label: "Enrollment" },
  { name: "year", label: "Year" },
  { name: "phone", label: "Phone" },
  { name: "github", label: "GitHub" },
  { name: "linkedin", label: "LinkedIn" },
  { name: "domains", label: "Domains" },
  { name: "experience", label: "Past work" },
  { name: "files", label: "Files" },
  { name: "why", label: "Why MATRIX" },
];
export const EVENT_TYPES = ["view", "section", "ping", "form_start", "field", "submit_error", "submitted", "click"];
// Links whose clicks are counted (data-track="..." on the <a>).
export const CLICK_TARGETS = ["dev_linkedin"];
// A started form counts as abandoned once the visitor has been gone this long.
export const ABANDON_AFTER_MS = 30 * 60 * 1000;

export type Session = {
  sid: string;
  firstSeen: Date | string;
  lastSeen: Date | string;
  source?: string;
  referrer?: string;
  device?: string;
  activeMs?: number;
  maxScroll?: number;
  sections?: string[];
  fields?: string[];
  lastField?: string;
  formStarted?: boolean;
  submitted?: boolean;
  lastError?: string;
  clicks?: Record<string, number>;
  lastClickAt?: Date | string;
  // Set by /api/apply when this visit ended in an application.
  applicantEmail?: string;
};

// utm_source wins; then in-app browsers (they usually send no referrer); then the referring site.
export function sourceOf(utm: string, referrer: string, ua: string, ownHost: string) {
  if (utm) return utm.toLowerCase();
  if (/Instagram/i.test(ua)) return "instagram";
  if (/FBAN|FBAV/i.test(ua)) return "facebook";
  if (/LinkedInApp/i.test(ua)) return "linkedin";
  if (/WhatsApp/i.test(ua)) return "whatsapp";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (!host || host === ownHost) return "direct";
    for (const name of ["instagram", "linkedin", "whatsapp", "google", "youtube", "facebook"]) if (host.includes(name)) return name;
    if (host === "lnkd.in") return "linkedin";
    if (host === "t.co" || host.includes("twitter") || host === "x.com") return "x";
    return host;
  } catch {
    return "direct";
  }
}

export function deviceOf(ua: string) {
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

const DAY = 24 * 60 * 60 * 1000;
const ist = (ms: number) => new Date(ms + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

// `names` maps applicant email -> name, so clicks from visitors who applied show who they were.
export function summarize(rows: Session[], now = Date.now(), days = 14, names = new Map<string, string>()) {
  const t = (d: Date | string) => new Date(d).getTime();
  const started = rows.filter((s) => s.formStarted);
  const abandoned = started.filter((s) => !s.submitted && now - t(s.lastSeen) > ABANDON_AFTER_MS);
  const times = rows.map((s) => s.activeMs ?? 0).filter((x) => x > 0).sort((a, b) => a - b);

  const group = (key: (s: Session) => string) => {
    const m = new Map<string, { key: string; sessions: number; started: number; submitted: number }>();
    for (const s of rows) {
      const k = key(s);
      const g = m.get(k) ?? { key: k, sessions: 0, started: 0, submitted: 0 };
      g.sessions++;
      if (s.formStarted) g.started++;
      if (s.submitted) g.submitted++;
      m.set(k, g);
    }
    return [...m.values()].sort((a, b) => b.sessions - a.sessions);
  };

  const daily = Array.from({ length: days }, (_, i) => ({ day: ist(now - (days - 1 - i) * DAY), sessions: 0, submitted: 0 }));
  const byDay = new Map(daily.map((d) => [d.day, d]));
  for (const s of rows) {
    const d = byDay.get(ist(t(s.firstSeen)));
    if (d) {
      d.sessions++;
      if (s.submitted) d.submitted++;
    }
  }

  const clickers = rows.filter((s) => s.clicks?.dev_linkedin);

  return {
    devLinkedin: {
      clicks: clickers.reduce((n, s) => n + (s.clicks?.dev_linkedin ?? 0), 0),
      visitors: clickers.length,
      list: clickers.slice(0, 100).map((s) => ({
        at: s.lastClickAt ?? s.lastSeen,
        source: s.source || "direct",
        device: s.device || "unknown",
        clicks: s.clicks?.dev_linkedin ?? 0,
        applicant: names.get(s.applicantEmail ?? "") ?? "",
      })),
    },
    totals: {
      sessions: rows.length,
      started: started.length,
      submitted: rows.filter((s) => s.submitted).length,
      abandoned: abandoned.length,
      avgActiveMs: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
      medianActiveMs: times.length ? times[Math.floor(times.length / 2)] : 0,
    },
    sources: group((s) => s.source || "direct"),
    devices: group((s) => s.device || "unknown"),
    sections: SECTIONS.map((k) => ({ key: k, label: SECTION_LABELS[k], count: rows.filter((s) => s.sections?.includes(k)).length })),
    fields: FIELDS.map((f) => ({ key: f.name, label: f.label, count: started.filter((s) => s.fields?.includes(f.name)).length })),
    daily,
    abandoned: abandoned.slice(0, 50).map((s) => ({
      lastSeen: s.lastSeen,
      source: s.source || "direct",
      device: s.device || "unknown",
      activeMs: s.activeMs ?? 0,
      filled: s.fields?.length ?? 0,
      lastField: FIELDS.find((f) => f.name === s.lastField)?.label ?? "",
      maxScroll: s.maxScroll ?? 0,
      lastError: s.lastError ?? "",
    })),
  };
}

export type Stats = ReturnType<typeof summarize>;
