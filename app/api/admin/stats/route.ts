import { adminRole, applications, sessions } from "@/lib/db";
import { summarize, type Session } from "@/lib/track";

export async function GET(req: Request) {
  const role = adminRole(req);
  if (!role) return Response.json({ error: "Invalid key" }, { status: 401 });
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  // shortcut: aggregates up to 20k recent sessions in memory; switch to a $group pipeline if traffic outgrows that.
  const rows = await (await sessions())
    .find({ lastSeen: { $gte: since } }, { projection: { _id: 0, ua: 0 } })
    .sort({ lastSeen: -1 })
    .limit(20_000)
    .toArray();
  const apps = await (await applications()).find({}, { projection: { _id: 0, email: 1, name: 1 } }).toArray();
  const stats = summarize(rows as unknown as Session[], Date.now(), 14, new Map(apps.map((a) => [a.email, a.name])));
  // Developer LinkedIn clicks are for the master key only; leave them out of the response otherwise.
  const { devLinkedin, ...shared } = stats;
  return Response.json(role === "master" ? { ...shared, devLinkedin } : shared);
}
