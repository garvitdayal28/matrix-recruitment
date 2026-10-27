import { adminRole, applications } from "@/lib/db";

export async function GET(req: Request) {
  const role = adminRole(req);
  if (!role) return Response.json({ error: "Invalid key" }, { status: 401 });
  const rows = await (await applications()).find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
  // The admin UI uses the role to decide whether to show the stats tab.
  return Response.json(rows, { headers: { "X-Admin-Role": role } });
}
