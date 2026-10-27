import { test } from "node:test";
import assert from "node:assert/strict";
import { deviceOf, sourceOf, summarize } from "./track.ts";

test("attributes traffic sources", () => {
  assert.equal(sourceOf("WhatsApp", "", "", "x.app"), "whatsapp");
  assert.equal(sourceOf("", "", "Mozilla/5.0 (iPhone) Instagram 300.0", "x.app"), "instagram");
  assert.equal(sourceOf("", "https://l.instagram.com/?u=1", "", "x.app"), "instagram");
  assert.equal(sourceOf("", "https://lnkd.in/abc", "", "x.app"), "linkedin");
  assert.equal(sourceOf("", "https://x.app/#apply", "", "x.app"), "direct");
  assert.equal(sourceOf("", "", "", "x.app"), "direct");
  assert.equal(sourceOf("", "https://www.example.org/post", "", "x.app"), "example.org");
});

test("detects devices", () => {
  assert.equal(deviceOf("Mozilla/5.0 (Linux; Android 14) Mobile Safari"), "mobile");
  assert.equal(deviceOf("Mozilla/5.0 (iPad; CPU OS 17_0)"), "tablet");
  assert.equal(deviceOf("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"), "desktop");
});

test("summarizes sessions", () => {
  const now = Date.parse("2026-10-28T12:00:00Z");
  const ago = (min: number) => new Date(now - min * 60_000);
  const s = summarize(
    [
      { sid: "a", firstSeen: ago(120), lastSeen: ago(100), source: "instagram", device: "mobile", activeMs: 60_000, formStarted: true, fields: ["name", "email"], lastField: "email", sections: ["about", "apply"] },
      { sid: "b", firstSeen: ago(50), lastSeen: ago(40), source: "instagram", device: "mobile", activeMs: 120_000, formStarted: true, submitted: true, fields: ["name"] },
      { sid: "c", firstSeen: ago(5), lastSeen: ago(1), source: "direct", device: "desktop", formStarted: true },
      { sid: "d", firstSeen: ago(3000), lastSeen: ago(3000), device: "mobile" },
    ],
    now,
  );
  assert.deepEqual(s.totals, { sessions: 4, started: 3, submitted: 1, abandoned: 1, avgActiveMs: 90_000, medianActiveMs: 120_000 });
  assert.deepEqual(s.sources[0], { key: "instagram", sessions: 2, started: 2, submitted: 1 });
  assert.equal(s.fields.find((f) => f.key === "name")?.count, 2);
  assert.equal(s.sections.find((x) => x.key === "apply")?.count, 1);
  assert.equal(s.abandoned[0].lastField, "Email");
  assert.equal(s.daily.length, 14);
  assert.equal(s.daily.at(-1)?.sessions, 3); // d is 50h old, outside today
});

test("counts developer LinkedIn clicks and names applicants", () => {
  const now = Date.parse("2026-10-28T12:00:00Z");
  const at = new Date(now - 60_000);
  const s = summarize(
    [
      { sid: "a", firstSeen: at, lastSeen: at, source: "instagram", clicks: { dev_linkedin: 2 }, applicantEmail: "asha@example.com" },
      { sid: "b", firstSeen: at, lastSeen: at, clicks: { dev_linkedin: 1 } },
      { sid: "c", firstSeen: at, lastSeen: at },
    ],
    now,
    14,
    new Map([["asha@example.com", "Asha Verma"]]),
  );
  assert.equal(s.devLinkedin.clicks, 3);
  assert.equal(s.devLinkedin.visitors, 2);
  assert.equal(s.devLinkedin.list[0].applicant, "Asha Verma");
  assert.equal(s.devLinkedin.list[1].applicant, "");
});
