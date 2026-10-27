import { applications, isAdmin } from "@/lib/db";

export async function GET(req: Request) {
  if (!isAdmin(req)) return Response.json({ error: "Invalid key" }, { status: 401 });
  const rows = await (await applications()).find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
  return Response.json(rows);
}
