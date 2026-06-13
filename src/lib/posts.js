import fs from "node:fs";
import path from "node:path";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { content: source, meta: {} };
  }

  const meta = Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(":");
        const key = line.slice(0, separator).trim();
        const rawValue = line.slice(separator + 1).trim();
        const value = rawValue.includes(",")
          ? rawValue.split(",").map((item) => item.trim()).filter(Boolean)
          : rawValue;
        return [key, value];
      }),
  );

  return { content: match[2].trim(), meta };
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getAllPosts() {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const source = fs.readFileSync(path.join(POSTS_DIR, fileName), "utf8");
      const { content, meta } = parseFrontmatter(source);
      return {
        category: meta.category,
        content,
        date: meta.date,
        excerpt: meta.excerpt,
        slug: meta.slug ?? fileName.replace(/\.md$/, ""),
        tags: normalizeTags(meta.tags),
        title: meta.title,
      };
    })
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}

export function getPostBySlug(slug) {
  return getAllPosts().find((post) => post.slug === slug) ?? null;
}

export function getPostsByCategory() {
  return getAllPosts().reduce((groups, post) => {
    const category = post.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(post);
    return groups;
  }, {});
}
