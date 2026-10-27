import { test } from "node:test";
import assert from "node:assert/strict";
import { validate, fileKind, BRANCHES, YEARS } from "./fields.ts";

const ok = {
  name: " Asha Verma ",
  email: "Asha@Example.com",
  branch: BRANCHES[0],
  year: YEARS[0],
  enrollment: "",
  phone: "+91 98765 43210",
  github: "github.com/asha",
  linkedin: "",
  domains: ["Technical", "Technical", "Graphics & Editing"],
  experience: "",
  why: "I like building things.",
};

test("normalizes a valid application", () => {
  const { data } = validate(ok);
  assert.deepEqual(data, {
    ...ok,
    name: "Asha Verma",
    email: "asha@example.com",
    phone: "9876543210",
    github: "https://github.com/asha",
    domains: ["Technical", "Graphics & Editing"],
  });
  assert.equal(validate({ ...ok, enrollment: "0201cs261001" }).data?.enrollment, "0201CS261001");
  assert.equal(validate({ ...ok, linkedin: "https://in.linkedin.com/in/asha" }).data?.linkedin, "https://in.linkedin.com/in/asha");
});

test("rejects bad input", () => {
  assert.ok(validate(null).error);
  assert.ok(validate({ ...ok, branch: "Hacker" }).error);
  assert.ok(validate({ ...ok, domains: ["Technical", "Nope"] }).error);
  assert.ok(validate({ ...ok, domains: [] }).error);
  assert.ok(validate({ ...ok, phone: "12345" }).error);
  assert.ok(validate({ ...ok, enrollment: "ab" }).error);
  assert.ok(validate({ ...ok, github: "evil.com/github.com" }).error);
  assert.ok(validate({ ...ok, github: "javascript:alert(1)" }).error);
  assert.ok(validate({ ...ok, linkedin: "notlinkedin.com/in/x" }).error);
  assert.ok(validate({ ...ok, why: "x".repeat(2001) }).error);
});

test("detects file types by content", () => {
  const bytes = (s: string) => new Uint8Array([...s].map((c) => c.charCodeAt(0)));
  assert.equal(fileKind("a.pdf", bytes("%PDF-1.7")), "pdf");
  assert.equal(fileKind("a.png", bytes("\x89PNG\r\n")), "png");
  assert.equal(fileKind("a.jpg", bytes("\xff\xd8\xff\xe0")), "jpg");
  assert.equal(fileKind("a.webp", bytes("RIFF\0\0\0\0WEBP")), "webp");
  assert.equal(fileKind("cv.docx", bytes("PK\x03\x04")), "docx");
  assert.equal(fileKind("evil.zip", bytes("PK\x03\x04")), null);
  assert.equal(fileKind("evil.pdf", bytes("<html>")), null);
});
