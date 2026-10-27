import { createHash, timingSafeEqual } from "node:crypto";
import { GridFSBucket, MongoClient, type ObjectId } from "mongodb";
import type { Application, FILE_TYPES } from "./fields";

export type StoredFile = { id: ObjectId; name: string; kind: keyof typeof FILE_TYPES };
export type StoredApplication = Application & { files: StoredFile[]; createdAt: Date };

const DB = "matrix_recruitment";
// Server-only. One client reused across hot reloads and warm serverless invocations.
const g = globalThis as unknown as { mongo?: Promise<MongoClient> };

async function db() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  g.mongo ??= new MongoClient(uri)
    .connect()
    .then(async (c) => {
      // One application per email; one visitor-session doc per sid.
      await c.db(DB).collection("applications").createIndex({ email: 1 }, { unique: true });
      await c.db(DB).collection("sessions").createIndex({ sid: 1 }, { unique: true });
      await c.db(DB).collection("sessions").createIndex({ lastSeen: -1 });
      return c;
    })
    .catch((e) => {
      g.mongo = undefined;
      throw e;
    });
  return (await g.mongo).db(DB);
}

export const applications = async () => (await db()).collection<StoredApplication>("applications");
// Visitor analytics (see lib/track.ts). No IPs or typed form values are stored.
export const sessions = async () => (await db()).collection("sessions");
// Portfolio uploads live in MongoDB too (GridFS), no separate file storage needed.
export const files = async () => new GridFSBucket(await db(), { bucketName: "portfolio" });

const digest = (s: string) => createHash("sha256").update(s).digest();
export function isAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  return !!secret && timingSafeEqual(digest(req.headers.get("x-admin-key") ?? ""), digest(secret));
}
