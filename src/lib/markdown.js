import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";

function textContent(node) {
  if (node.type === "text") return node.value;
  if (node.type === "element" && node.tagName === "br") return " ";
  return (node.children || []).map(textContent).join("");
}

function toHeadingId(text, usedIds) {
  const base = text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\u3000]+/g, "-")
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";

  let id = base;
  let suffix = 2;

  while (usedIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(id);
  return id;
}

function rehypeCollectHeadings(headings) {
  return (tree) => {
    const usedIds = new Set();

    const walk = (node) => {
      if (node.type === "element" && /^h[1-6]$/.test(node.tagName)) {
        const text = textContent(node).replace(/\s+/g, " ").trim();

        if (text) {
          const id = toHeadingId(text, usedIds);
          node.properties = { ...node.properties, id };
          headings.push({ id, depth: Number(node.tagName[1]), text });
        }
      }

      (node.children || []).forEach(walk);
    };

    walk(tree);
  };
}

export async function renderMarkdown(content) {
  const headings = [];
  const rendered = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeCollectHeadings, headings)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(content);

  return { html: String(rendered), headings };
}
