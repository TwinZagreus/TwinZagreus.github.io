import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../../../../lib/server/auth";
import { serverConfig } from "../../../../lib/server/config";
import { handleRouteError, json } from "../../../../lib/server/responses";

const ALLOWED_SUFFIXES = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

export async function POST(request) {
  try {
    requireAuth();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return json({ detail: "Missing file." }, { status: 400 });
    }

    const suffix = path.extname(file.name || "").toLowerCase();
    if (!ALLOWED_SUFFIXES.has(suffix)) {
      return json({ detail: "Unsupported file type." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (!bytes.length) {
      return json({ detail: "Empty file." }, { status: 400 });
    }
    if (bytes.length > 8 * 1024 * 1024) {
      return json({ detail: "File too large." }, { status: 400 });
    }

    await fs.mkdir(serverConfig.uploadsDir, { recursive: true });
    const filename = `${randomUUID().replace(/-/g, "")}${suffix}`;
    await fs.writeFile(path.join(serverConfig.uploadsDir, filename), bytes);

    return json({ filename, url: `/uploads/${filename}` });
  } catch (error) {
    return handleRouteError(error);
  }
}
