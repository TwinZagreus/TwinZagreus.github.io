import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";

const postsDirectory = path.join(process.cwd(), "content", "posts");

function parseValue(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^['\"]|['\"]$/g, ""))
      .filter(Boolean);
  }
  return trimmed.replace(/^['\"]|['\"]$/g, "");
}

function parseMarkdownFile(filename) {
  const raw = fs.readFileSync(path.join(postsDirectory, filename), "utf8");
  const parsed = matter(raw);
  const data = parsed.data;
  const body = parsed.content.trim();
  const words = readingTime(body).minutes;

  return {
    ...data,
    slug: data.slug || filename.replace(/\.md$/, ""),
    tags: Array.isArray(data.tags) ? data.tags : parseValue(data.tags || ""),
    date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date || ""),
    body,
    readingTime: `${Math.max(1, Math.ceil(words))} min read`,
  };
}

export function getPosts() {
  if (!fs.existsSync(postsDirectory)) return [];
  return fs
    .readdirSync(postsDirectory)
    .filter((filename) => filename.endsWith(".md"))
    .map(parseMarkdownFile)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getPostBySlug(slug) {
  return getPosts().find((post) => post.slug === slug);
}
