import { CLICK_TARGETS, EVENT_TYPES, FIELDS, SECTIONS, deviceOf, sourceOf } from "@/lib/track";
import { sessions } from "@/lib/db";

const FIELD_NAMES = FIELDS.map((f) => f.name);
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
const num = (v: unknown, max: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(Math.max(v, 0), max) : 0);

// Public, unauthenticated event sink for the visitor tracker. Every field is clipped or allow-listed.
// shortcut: no rate limiting, so anyone can inflate the stats; add one (e.g. per-IP in middleware) if numbers look off.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Record<string, any> | null;
  if (!b || typeof b.sid !== "string" || !/^[0-9a-f-]{36}$/.test(b.sid) || !EVENT_TYPES.includes(b.type)) {
    return new Response(null, { status: 400 });
  }

  const now = new Date();
  const set: Record<string, unknown> = { lastSeen: now };
  const update: Record<string, any> = { $set: set, $setOnInsert: { firstSeen: now } };

  switch (b.type) {
    case "view": {
      const ua = clip(req.headers.get("user-agent"), 300);
      const referrer = clip(b.referrer, 300);
      const utm = { source: clip(b.utm?.source, 60), medium: clip(b.utm?.medium, 60), campaign: clip(b.utm?.campaign, 60) };
      Object.assign(update.$setOnInsert, {
        referrer,
        utm,
        ua,
        landing: clip(b.path, 300),
        source: sourceOf(utm.source, referrer, ua, new URL(req.url).hostname),
        device: deviceOf(ua),
        screen: clip(b.screen, 20),
        lang: clip(b.lang, 20),
      });
      update.$inc = { views: 1 };
      break;
    }
    case "section":
      if (SECTIONS.includes(b.name)) update.$addToSet = { sections: b.name };
      break;
    case "ping":
      update.$inc = { activeMs: num(b.activeMs, 60_000) };
      update.$max = { maxScroll: num(b.scroll, 100) };
      break;
    case "field":
      if (FIELD_NAMES.includes(b.name)) {
        update.$addToSet = { fields: b.name };
        set.lastField = b.name;
      }
      break;
    case "submit_error":
      update.$inc = { submitErrors: 1 };
      set.lastError = clip(b.error, 200);
      break;
    case "submitted":
      set.submitted = true;
      set.submittedAt = now;
      break;
    case "click":
      if (CLICK_TARGETS.includes(b.name)) {
        update.$inc = { [`clicks.${b.name}`]: 1 };
        set.lastClickAt = now;
      }
      break;
  }
  // Any form activity means the form was started, even if the focus event was missed (e.g. autofill).
  if (["form_start", "field", "submit_error", "submitted"].includes(b.type)) {
    set.formStarted = true;
    update.$min = { formStartedAt: now };
  }

  try {
    await (await sessions()).updateOne({ sid: b.sid }, update, { upsert: true });
  } catch (e) {
    // Two first events racing on a new sid can hit the unique index; the other one landed.
    if ((e as { code?: number }).code !== 11000) console.error(e);
  }
  return new Response(null, { status: 204 });
}
