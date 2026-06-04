"use client";

import { alpha } from "@mui/material/styles";
import { motion, useReducedMotion } from "framer-motion";
import TransitionLink from "@/components/TransitionLink";
import { useProjectTheme } from "@/context/ProjectThemeContext";

function getHeadings(markdown) {
  return markdown
    .split(/\r?\n/)
    .filter((line) => /^#{2,3}\s+/.test(line))
    .map((line) => line.replace(/^#{2,3}\s+/, "").trim());
}

function MarkdownBody({ content }) {
  const { colorMap } = useProjectTheme();
  const blocks = [];
  let listItems = [];

  const flushList = () => {
    if (!listItems.length) {
      return;
    }

    blocks.push({ items: listItems, type: "list" });
    listItems = [];
  };

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2));
      return;
    }

    flushList();

    if (trimmed.startsWith("### ")) {
      blocks.push({ text: trimmed.slice(4), type: "h3" });
      return;
    }

    if (trimmed.startsWith("## ")) {
      blocks.push({ text: trimmed.slice(3), type: "h2" });
      return;
    }

    if (trimmed.startsWith("# ")) {
      blocks.push({ text: trimmed.slice(2), type: "h1" });
      return;
    }

    blocks.push({ text: trimmed, type: "p" });
  });
  flushList();

  return (
    <div className="space-y-7">
      {blocks.map((block, index) => {
        if (block.type === "h1") {
          return null;
        }

        if (block.type === "h2") {
          return (
            <h2
              className="border-t pt-6 text-2xl uppercase leading-tight tracking-[0.12em]"
              key={`${block.type}-${index}`}
              style={{ borderColor: alpha(colorMap.neutral700, 0.32), color: colorMap.ink800 }}
            >
              {block.text}
            </h2>
          );
        }

        if (block.type === "h3") {
          return (
            <h3
              className="text-lg uppercase leading-tight tracking-[0.14em]"
              key={`${block.type}-${index}`}
              style={{ color: colorMap.ink700 }}
            >
              {block.text}
            </h3>
          );
        }

        if (block.type === "list") {
          return (
            <ul className="space-y-3" key={`${block.type}-${index}`}>
              {block.items.map((item) => (
                <li
                  className="grid grid-cols-[1.25rem_1fr] text-[15px] leading-8"
                  key={item}
                  style={{ color: colorMap.neutral800 }}
                >
                  <span style={{ color: colorMap.coral }}>+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p
            className="text-[16px] leading-8 tracking-[0.02em]"
            key={`${block.type}-${index}`}
            style={{ color: colorMap.ink800 }}
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

export default function WritingArticlePage({ post }) {
  const isReducedMotion = useReducedMotion();
  const { colorMap } = useProjectTheme();
  const headings = getHeadings(post.content);

  return (
    <main className="relative z-10 min-h-screen px-5 py-20 sm:px-7 lg:py-24" style={{ color: colorMap.ink950 }}>
      <motion.div
        className="mx-auto grid w-full max-w-[1440px] gap-10 lg:grid-cols-[minmax(220px,0.55fr)_minmax(0,1fr)_minmax(240px,0.48fr)]"
        initial={isReducedMotion ? false : { opacity: 0, y: 34 }}
        animate={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
      >
        <aside className="lg:sticky lg:top-10 lg:h-[calc(100vh-5rem)]">
          <TransitionLink
            className="inline-block border-t pt-4 text-[10px] uppercase tracking-[0.32em] transition-transform hover:-translate-x-1"
            href="/#writing"
            label="Back to field notes"
            style={{ borderColor: alpha(colorMap.neutral700, 0.42), color: colorMap.neutral700 }}
          >
            Back / index
          </TransitionLink>

          <div className="mt-12 hidden lg:block">
            <div
              className="text-[10px] uppercase tracking-[0.34em]"
              style={{ color: colorMap.neutral700 }}
            >
              Category
            </div>
            <div
              className="mt-3 text-2xl uppercase leading-tight tracking-[0.14em]"
              style={{ color: colorMap.ink800 }}
            >
              {post.category}
            </div>
          </div>
        </aside>

        <article
          className="border px-5 py-8 backdrop-blur-[2px] sm:px-8 lg:px-10 lg:py-10"
          style={{
            backgroundColor: alpha(colorMap.coral100, 0.56),
            borderColor: alpha(colorMap.neutral700, 0.34),
          }}
        >
          <header>
            <div
              className="text-[10px] uppercase tracking-[0.34em]"
              style={{ color: colorMap.neutral700 }}
            >
              {post.date} / {post.category}
            </div>
            <h1
              className="mt-5 text-[clamp(2.6rem,6vw,6.4rem)] uppercase leading-[0.88] tracking-[0.04em]"
              style={{ color: colorMap.ink800 }}
            >
              {post.title}
            </h1>
            <p
              className="mt-8 max-w-2xl text-[12px] uppercase leading-relaxed tracking-[0.22em]"
              style={{ color: colorMap.neutral700 }}
            >
              {post.excerpt}
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  className="border px-3 py-1 text-[10px] uppercase tracking-[0.22em]"
                  key={tag}
                  style={{
                    borderColor: alpha(colorMap.neutral700, 0.32),
                    color: colorMap.ink700,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </header>

          <div className="mt-12">
            <MarkdownBody content={post.content} />
          </div>
        </article>

        <aside className="lg:sticky lg:top-10 lg:h-[calc(100vh-5rem)]">
          <nav
            aria-label="Article outline"
            className="border p-5 backdrop-blur-[2px]"
            style={{
              backgroundColor: alpha(colorMap.coral100, 0.42),
              borderColor: alpha(colorMap.neutral700, 0.3),
            }}
          >
            <div
              className="text-[10px] uppercase tracking-[0.32em]"
              style={{ color: colorMap.neutral700 }}
            >
              Article map
            </div>
            <div className="mt-5 space-y-3">
              {headings.map((heading) => (
                <div
                  className="border-t pt-3 text-[11px] uppercase leading-snug tracking-[0.18em]"
                  key={heading}
                  style={{ borderColor: alpha(colorMap.neutral700, 0.22), color: colorMap.ink700 }}
                >
                  {heading}
                </div>
              ))}
            </div>
          </nav>
        </aside>
      </motion.div>
    </main>
  );
}
