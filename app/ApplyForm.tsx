"use client";

import { useEffect, useRef, useState } from "react";
import { BRANCHES, DOMAINS, FILE_ACCEPT, MAX_FILES, MAX_TOTAL_BYTES, YEARS } from "@/lib/fields";
import Alert from "./Alert";
import FilePicker from "./FilePicker";
import Select from "./Select";
import { fieldFilled, sessionId, track } from "./Tracker";

// Shown only after a successful submission.
const WHATSAPP_GROUP = "https://chat.whatsapp.com/JzOn0dpvGxh0eYtgUrivFb";

export default function ApplyForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [branchMissing, setBranchMissing] = useState(false);
  const done = useRef<HTMLDivElement>(null);

  // The form is long; bring the confirmation into view once it replaces it.
  useEffect(() => {
    if (status === "done") done.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [status]);

  // Errors are also sent to the stats page, so admins can see where people get stuck.
  function fail(msg: string) {
    setError(msg);
    track("submit_error", { error: msg });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const files = (fd.getAll("files") as File[]).filter((f) => f.size > 0);
    if (!fd.get("branch")) {
      setBranchMissing(true);
      return fail("Select your branch.");
    }
    if (!fd.getAll("domains").length) return fail("Select at least one domain.");
    if (files.length > MAX_FILES) return fail(`Attach at most ${MAX_FILES} files.`);
    if (files.reduce((n, f) => n + f.size, 0) > MAX_TOTAL_BYTES) return fail("Attached files must add up to 4 MB or less.");

    setStatus("sending");
    setError("");
    // Links this visit's stats (e.g. LinkedIn clicks) to the application.
    fd.set("sid", sessionId());
    try {
      const res = await fetch("/api/apply", { method: "POST", body: fd });
      if (res.ok) {
        track("submitted");
        return setStatus("done");
      }
      fail((await res.json().catch(() => null))?.error ?? "Something went wrong. Please try again.");
    } catch {
      fail("Network error. Check your connection and try again.");
    }
    setStatus("idle");
  }

  if (status === "done") {
    return (
      <div className="done" role="status" ref={done}>
        <svg className="done-check" viewBox="0 0 52 52" aria-hidden="true">
          <circle cx="26" cy="26" r="24" pathLength={1} />
          <path d="M15 27l7 7 15-16" pathLength={1} />
        </svg>
        <h2>Application submitted</h2>
        <p>Thanks for applying to MATRIX. Join the WhatsApp group for applicants. Next steps will be shared there.</p>
        <a className="btn" href={WHATSAPP_GROUP} target="_blank" rel="noreferrer">
          Join the WhatsApp group
        </a>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="row">
        <label className="field">
          <span>Candidate Full Name</span>
          <input type="text" name="name" required maxLength={100} autoComplete="name" autoCapitalize="words" enterKeyHint="next" />
        </label>
        <label className="field">
          <span>Email Address</span>
          <input type="email" name="email" required maxLength={200} autoComplete="email" autoCapitalize="none" spellCheck={false} enterKeyHint="next" />
        </label>
      </div>

      <div className="row">
        <div className="field">
          <span id="branch-label">Branch</span>
          <Select
            name="branch"
            labelId="branch-label"
            placeholder="Choose your branch"
            options={BRANCHES}
            invalid={branchMissing}
            onChange={() => {
              setBranchMissing(false);
              fieldFilled("branch");
            }}
          />
        </div>
        <label className="field">
          <span>Enrollment Number <em>optional</em></span>
          <input type="text" name="enrollment" maxLength={30} autoCapitalize="characters" autoCorrect="off" spellCheck={false} enterKeyHint="next" pattern="[A-Za-z0-9/\-]{4,30}" title="Letters, numbers, / and - only" />
          <small>1st years can leave this blank.</small>
        </label>
      </div>

      <fieldset className="field">
        <legend>Current Academic Year</legend>
        <div className="choices">
          {YEARS.map((y) => (
            <label className="choice" key={y}>
              <input type="radio" name="year" value={y} required />
              <span className="tick" aria-hidden="true" />
              {y}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>Phone Number</span>
        <input type="tel" name="phone" required inputMode="tel" autoComplete="tel-national" placeholder="98765 43210" enterKeyHint="next" />
        <small>Enter your mobile number linked to WhatsApp. We&apos;ll use this number for further communication.</small>
      </label>

      <div className="row">
        <label className="field">
          <span>GitHub <em>optional</em></span>
          <input type="text" name="github" inputMode="url" maxLength={200} placeholder="github.com/username" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next" />
        </label>
        <label className="field">
          <span>LinkedIn <em>optional</em></span>
          <input type="text" name="linkedin" inputMode="url" maxLength={200} placeholder="linkedin.com/in/username" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next" />
        </label>
      </div>

      <fieldset className="field">
        <legend>Domains of Interest</legend>
        <small>Select every domain you would like to work in.</small>
        <div className="choices">
          {DOMAINS.map((d) => (
            <label className="choice" key={d}>
              <input type="checkbox" name="domains" value={d} />
              <span className="tick" aria-hidden="true" />
              {d}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>Past Work / Experience <em>optional</em></span>
        <textarea name="experience" maxLength={3000} placeholder="Projects, events, designs, videos, writing. Links are welcome." />
      </label>
      <div className="field">
        <span id="files-label">Portfolio Files <em>optional</em></span>
        <FilePicker name="files" accept={FILE_ACCEPT} labelId="files-label" />
        <small>Up to 3 files, 4 MB in total. PDF, DOCX, PNG, JPG or WEBP.</small>
      </div>

      <label className="field">
        <span>Why do you want to join MATRIX?</span>
        <textarea name="why" required maxLength={2000} />
      </label>

      {error && <Alert onClose={() => setError("")}>{error}</Alert>}
      <div>
        <button className="btn" disabled={status === "sending"}>
          {status === "sending" && <span className="spinner" aria-hidden="true" />}
          {status === "sending" ? "Submitting…" : "Submit application"}
        </button>
      </div>
    </form>
  );
}
