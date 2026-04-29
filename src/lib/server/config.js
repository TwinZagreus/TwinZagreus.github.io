import path from "node:path";
import fs from "node:fs";

const projectRoot = process.cwd();
const backendRoot = path.join(projectRoot, "backend");

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((accumulator, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return accumulator;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, "");

      accumulator[key] = value;
      return accumulator;
    }, {});
}

const envSource = {
  ...readEnvFile(path.join(backendRoot, ".env")),
  ...readEnvFile(path.join(projectRoot, ".env")),
  ...readEnvFile(path.join(projectRoot, ".env.local")),
  ...process.env,
};

function resolvePath(rawValue, fallback) {
  const target = rawValue?.trim() ? rawValue.trim() : fallback;
  if (path.isAbsolute(target)) {
    return target;
  }

  return path.join(projectRoot, target);
}

export const serverConfig = {
  adminPassword: envSource.ADMIN_PASSWORD || "change-this-password",
  adminUsername: envSource.ADMIN_USERNAME || "admin",
  appSecretKey: envSource.APP_SECRET_KEY || "dev-secret-key",
  databasePath: resolvePath(envSource.DATABASE_PATH, "backend/data/blog.db"),
  uploadsDir: resolvePath(envSource.UPLOADS_DIR, "backend/uploads"),
};
