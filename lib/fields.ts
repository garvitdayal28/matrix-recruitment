// Same fields as the recruitment Google Form, plus profiles and past work. Shared by the form UI and server validation.
export const BRANCHES = [
  "CSE — Computer Science & Engineering",
  "AI & DS — Artificial Intelligence & Data Science",
  "IT — Information Technology",
  "ECE — Electronics & Telecommunication",
  "EE — Electrical Engineering",
  "MT — Mechatronics Engineering",
  "ME — Mechanical Engineering",
  "CE — Civil Engineering",
  "IP — Industrial & Production Engineering",
];
export const YEARS = ["1st Year (Batch 2026-2030)", "2nd Year (Batch 2025-2029)"];
export const DOMAINS = ["Technical", "Management & PR", "Graphics & Editing", "Content & Social Media"];

export type Application = {
  name: string;
  email: string;
  branch: string;
  year: string;
  enrollment: string;
  phone: string;
  github: string;
  linkedin: string;
  domains: string[];
  experience: string;
  why: string;
};

// Past-work uploads.
export const MAX_FILES = 3;
// shortcut: files go through our API route and Vercel caps request bodies at 4.5 MB; switch to signed direct-to-Storage uploads if people need bigger files.
export const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
export const FILE_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};
export const FILE_ACCEPT = ".pdf,.docx,.png,.jpg,.jpeg,.webp";

// Detect the real type from the file's first bytes, not the browser-supplied MIME type.
export function fileKind(name: string, b: Uint8Array): keyof typeof FILE_TYPES | null {
  const starts = (...sig: number[]) => sig.every((x, i) => b[i] === x);
  if (starts(0x25, 0x50, 0x44, 0x46)) return "pdf";
  if (starts(0x89, 0x50, 0x4e, 0x47)) return "png";
  if (starts(0xff, 0xd8, 0xff)) return "jpg";
  if (starts(0x52, 0x49, 0x46, 0x46) && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return "webp";
  if (starts(0x50, 0x4b, 0x03, 0x04) && /\.docx$/i.test(name)) return "docx";
  return null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// "" when empty, the normalized https URL when it is on `host`, null when invalid.
function profileUrl(v: string, host: string) {
  if (!v) return "";
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return u.hostname === host || u.hostname.endsWith(`.${host}`) ? u.href : null;
  } catch {
    return null;
  }
}

export function validate(input: unknown): { data: Application; error?: undefined } | { data?: undefined; error: string } {
  const b = (input ?? {}) as Record<string, unknown>;
  // Accept "+91 98765 43210" style input, store the bare 10 digits.
  const phone = text(b.phone).replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  const github = profileUrl(text(b.github), "github.com");
  const linkedin = profileUrl(text(b.linkedin), "linkedin.com");
  const data: Application = {
    name: text(b.name),
    email: text(b.email).toLowerCase(),
    branch: text(b.branch),
    year: text(b.year),
    enrollment: text(b.enrollment).toUpperCase(),
    phone,
    github: github ?? "",
    linkedin: linkedin ?? "",
    domains: Array.isArray(b.domains) ? [...new Set(b.domains.map(text))] : [],
    experience: text(b.experience),
    why: text(b.why),
  };

  if (!data.name || data.name.length > 100) return { error: "Enter your full name." };
  if (!EMAIL_RE.test(data.email) || data.email.length > 200) return { error: "Enter a valid email address." };
  if (!BRANCHES.includes(data.branch)) return { error: "Select your branch." };
  if (!YEARS.includes(data.year)) return { error: "Select your current academic year." };
  // Optional: 1st years may not have one yet.
  if (data.enrollment && !/^[A-Z0-9/-]{4,30}$/.test(data.enrollment)) return { error: "Enter a valid enrollment number, or leave it blank." };
  if (!PHONE_RE.test(phone)) return { error: "Enter a valid 10-digit mobile number." };
  if (github === null) return { error: "Enter a github.com profile link, or leave it blank." };
  if (linkedin === null) return { error: "Enter a linkedin.com profile link, or leave it blank." };
  if (!data.domains.length || !data.domains.every((d) => DOMAINS.includes(d))) return { error: "Select at least one domain." };
  if (data.experience.length > 3000) return { error: "Keep past work under 3000 characters." };
  if (!data.why || data.why.length > 2000) return { error: "Tell us why you want to join (max 2000 characters)." };
  return { data };
}
