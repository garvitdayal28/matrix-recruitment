import { ObjectId } from "mongodb";
import { FILE_TYPES } from "@/lib/fields";
import { files, isAdmin } from "@/lib/db";

// Streams one portfolio file to the admin. Files are only reachable with the admin key.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return Response.json({ error: "Invalid key" }, { status: 401 });
  const { id } = await params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Not found" }, { status: 404 });

  const bucket = await files();
  const [file] = await bucket.find({ _id: new ObjectId(id) }).toArray();
  if (!file) return Response.json({ error: "Not found" }, { status: 404 });

  const chunks: Buffer[] = [];
  for await (const c of bucket.openDownloadStream(file._id)) chunks.push(c);
  return new Response(Buffer.concat(chunks), {
    headers: {
      "Content-Type": (file.metadata?.contentType as string) ?? FILE_TYPES.pdf,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.filename)}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
