import { ObjectId } from "mongodb";
import { FILE_TYPES, MAX_FILES, MAX_TOTAL_BYTES, fileKind, validate } from "@/lib/fields";
import { applications, files as fileBucket, sessions } from "@/lib/db";

const fail = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(req: Request) {
  const fd = await req.formData().catch(() => null);
  if (!fd) return fail("Invalid form submission.");

  const { data, error } = validate({ ...Object.fromEntries(fd), domains: fd.getAll("domains") });
  if (!data) return fail(error);

  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_FILES) return fail(`Attach at most ${MAX_FILES} files.`);
  if (files.reduce((n, f) => n + f.size, 0) > MAX_TOTAL_BYTES) return fail("Attached files must add up to 4 MB or less.");
  const uploads = [];
  for (const f of files) {
    const bytes = new Uint8Array(await f.arrayBuffer());
    const kind = fileKind(f.name, bytes);
    if (!kind) return fail(`${f.name} is not a PDF, DOCX, PNG, JPG or WEBP file.`);
    uploads.push({ bytes, kind, id: new ObjectId(), name: f.name.slice(0, 120) });
  }

  const col = await applications().catch((e) => (console.error(e), null));
  if (!col) return fail("Could not save your application. Please try again.", 500);
  try {
    await col.insertOne({
      ...data,
      files: uploads.map(({ id, name, kind }) => ({ id, name, kind })),
      createdAt: new Date(),
    });
  } catch (e) {
    if ((e as { code?: number }).code === 11000) return fail("An application with this email already exists.", 409);
    console.error(e);
    return fail("Could not save your application. Please try again.", 500);
  }

  const bucket = await fileBucket();
  try {
    await Promise.all(
      uploads.map(
        (u) =>
          new Promise((resolve, reject) =>
            bucket
              .openUploadStreamWithId(u.id, u.name, { metadata: { contentType: FILE_TYPES[u.kind] } })
              .on("finish", resolve)
              .on("error", reject)
              .end(Buffer.from(u.bytes)),
          ),
      ),
    );
  } catch (e) {
    // Roll back so the applicant can retry instead of hitting "already exists".
    console.error(e);
    await col.deleteOne({ email: data.email }).catch(() => {});
    await Promise.all(uploads.map((u) => bucket.delete(u.id).catch(() => {})));
    return fail("Could not upload your files. Please try again.", 500);
  }

  // Tie the visitor session to this applicant so stats can name them. Best effort only.
  const sid = fd.get("sid");
  if (typeof sid === "string" && /^[0-9a-f-]{36}$/.test(sid)) {
    await (await sessions()).updateOne({ sid }, { $set: { applicantEmail: data.email } }).catch((e) => console.error(e));
  }
  return Response.json({ ok: true }, { status: 201 });
}
