import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { serverConfig } from "../../../lib/server/config";

const MIME_TYPES = {
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(_, { params }) {
  const segments = Array.isArray(params.path) ? params.path : [];
  const targetPath = path.resolve(serverConfig.uploadsDir, ...segments);
  const basePath = path.resolve(serverConfig.uploadsDir);

  if (!targetPath.startsWith(basePath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const file = await fs.readFile(targetPath);
    const extension = path.extname(targetPath).toLowerCase();

    return new NextResponse(file, {
      headers: {
        "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
