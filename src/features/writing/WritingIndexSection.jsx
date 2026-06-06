"use client";

import { alpha } from "@mui/material/styles";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import TransitionLink from "@/components/TransitionLink";
import { useProjectTheme } from "@/context/ProjectThemeContext";
import {
  getRecentWritingPosts,
  getSortedWritingPosts,
  getWritingTags,
} from "@/features/writing/postIndex";

export default function WritingIndexSection() {
  const isReducedMotion = useReducedMotion();
  const { colorMap } = useProjectTheme();
  const recentPosts = getRecentWritingPosts(3);
  const allPosts = useMemo(() => getSortedWritingPosts(), []);
  const allTags = useMemo(() => getWritingTags(), []);
  const [activeTag, setActiveTag] = useState("all");
  const visiblePosts = useMemo(
    () => activeTag === "all" ? allPosts : allPosts.filter((post) => post.tags.includes(activeTag)),
    [activeTag, allPosts],
  );

  return (
    <section
      className="relative z-20 h-[100dvh] overflow-hidden px-5 py-10 sm:px-7 lg:py-12"
      id="writing"
      style={{
        "--writing-scroll-hover": colorMap.ink700,
        "--writing-scroll-thumb": colorMap.coral,
        "--writing-scroll-track": alpha(colorMap.coral100, 0.52),
        color: colorMap.ink950,
      }}
    >
      <style>
        {`
          .writing-scroll {
            scrollbar-color: var(--writing-scroll-thumb) var(--writing-scroll-track);
            scrollbar-gutter: stable;
            scrollbar-width: thin;
          }

          .writing-scroll::-webkit-scrollbar {
            width: 14px;
          }

          .writing-scroll::-webkit-scrollbar-button {
            display: none;
            height: 0;
            width: 0;
          }

          .writing-scroll::-webkit-scrollbar-track {
            background: var(--writing-scroll-track);
            border: 5px solid transparent;
            background-clip: content-box;
          }

          .writing-scroll::-webkit-scrollbar-thumb {
            background: var(--writing-scroll-thumb);
            border: 4px solid transparent;
            background-clip: content-box;
            box-shadow:
              inset 0 0 0 1px color-mix(in srgb, var(--writing-scroll-thumb) 72%, white 28%),
              0 0 12px color-mix(in srgb, var(--writing-scroll-thumb) 38%, transparent);
          }

          .writing-scroll::-webkit-scrollbar-thumb:hover {
            background: var(--writing-scroll-hover);
            background-clip: content-box;
          }
        `}
      </style>

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        initial={isReducedMotion ? false : { opacity: 0, scaleY: 0.7 }}
        whileInView={isReducedMotion ? undefined : { opacity: 1, scaleY: 1 }}
        viewport={{ once: true, margin: "-18%" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: `linear-gradient(180deg, ${alpha(colorMap.coral100, 0)} 0%, ${alpha(colorMap.coral100, 0.68)} 70%, ${alpha(colorMap.coral100, 0)} 100%)`,
          transformOrigin: "50% 0%",
        }}
      />

      <div className="relative mx-auto grid h-full min-h-0 w-full max-w-[1680px] gap-8 lg:grid-cols-[minmax(260px,0.72fr)_minmax(520px,1.35fr)_minmax(260px,0.62fr)]">
        <motion.header
          className="min-h-0"
          initial={isReducedMotion ? false : { opacity: 0, y: 28 }}
          whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-18%" }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="border-t pt-4 text-xs uppercase tracking-[0.32em]"
            style={{ borderColor: alpha(colorMap.coral, 0.5), color: colorMap.coral }}
          >
            Scroll index / markdown archive
          </div>
          <h2
            className="mt-7 max-w-xl text-[clamp(3.4rem,8vw,8.4rem)] uppercase leading-[0.82] tracking-[0.035em]"
            style={{ color: colorMap.ink800 }}
          >
            Field
            <br />
            Notes
          </h2>
          <p
            className="mt-8 max-w-sm text-sm uppercase leading-relaxed tracking-[0.18em]"
            style={{ color: colorMap.ink700 }}
          >
            A visual archive sorted by publish time. Filter by tags, keep the moving background alive, and open each field note as a spatial cut.
          </p>
        </motion.header>

        <div className="writing-scroll min-h-0 space-y-3 overflow-y-auto pr-3">
          {visiblePosts.map((post) => (
            <article
              className="group relative overflow-hidden border px-4 py-5 backdrop-blur-[2px] transition duration-200 ease-out hover:-translate-y-0.5 sm:px-6"
              key={post.slug}
              style={{
                backgroundColor: alpha(colorMap.coral100, 0.56),
                borderColor: alpha(colorMap.coral, 0.34),
              }}
            >
              <div
                className="absolute inset-y-0 left-0 w-[4px] origin-top scale-y-0 transition-transform duration-200 group-hover:scale-y-100"
                style={{ backgroundColor: colorMap.coral }}
              />
              <TransitionLink
                className="block outline-none"
                href={`/writing/${post.slug}`}
                label={post.title}
              >
                <div className="grid gap-5 md:grid-cols-[7.5rem_1fr]">
                  <div>
                    <div
                      className="text-xs uppercase tracking-[0.26em]"
                      style={{ color: colorMap.ink600 }}
                    >
                      {post.date}
                    </div>
                    <div
                      className="mt-3 text-xs uppercase tracking-[0.22em]"
                      style={{ color: colorMap.coral }}
                    >
                      {post.category}
                    </div>
                  </div>

                  <div>
                    <h3
                      className="text-xl uppercase leading-tight tracking-[0.12em]"
                      style={{ color: colorMap.ink900 }}
                    >
                      {post.title}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          className="rounded-full border px-2.5 py-1 text-xs uppercase tracking-[0.14em]"
                          key={tag}
                          style={{
                            backgroundColor: alpha(colorMap.coral, 0.08),
                            borderColor: alpha(colorMap.coral, 0.34),
                            color: colorMap.ink700,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p
                      className="mt-3 max-w-2xl text-sm uppercase leading-relaxed tracking-[0.14em]"
                      style={{ color: colorMap.ink700 }}
                    >
                      {post.excerpt}
                    </p>
                  </div>
                </div>
              </TransitionLink>
            </article>
          ))}
        </div>

        <aside className="writing-scroll min-h-0 space-y-5 overflow-y-auto pr-2">
          <section
            className="border p-5 backdrop-blur-[2px]"
            style={{
              backgroundColor: alpha(colorMap.coral100, 0.62),
              borderColor: alpha(colorMap.coral, 0.34),
            }}
          >
            <div
              className="border-t pt-4 text-xs uppercase tracking-[0.28em]"
              style={{ borderColor: alpha(colorMap.coral, 0.42), color: colorMap.coral }}
            >
              Recently updated
            </div>
            <div className="mt-5 space-y-5">
              {recentPosts.map((post) => (
                <TransitionLink
                  className="block outline-none transition-transform duration-200 hover:translate-x-1 focus-visible:translate-x-1"
                  href={`/writing/${post.slug}`}
                  key={post.slug}
                  label={post.title}
                >
                  <div
                    className="text-xs uppercase tracking-[0.2em]"
                    style={{ color: colorMap.ink600 }}
                  >
                    {post.date}
                  </div>
                  <h3
                    className="mt-2 text-base uppercase leading-snug tracking-[0.14em]"
                    style={{ color: colorMap.ink800 }}
                  >
                    {post.title}
                  </h3>
                </TransitionLink>
              ))}
            </div>
          </section>

          <nav
            aria-label="Writing tag filter"
            className="border p-5 backdrop-blur-[2px]"
            style={{
              backgroundColor: alpha(colorMap.coral100, 0.5),
              borderColor: alpha(colorMap.coral, 0.3),
            }}
          >
            <div
              className="text-xs uppercase tracking-[0.28em]"
              style={{ color: colorMap.coral }}
            >
              Tag filter
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {["all", ...allTags].map((tag) => {
                const isActive = tag === activeTag;

                return (
                  <button
                    className="rounded-full border px-3 py-2 text-xs uppercase tracking-[0.14em] transition duration-200 hover:-translate-y-0.5"
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    style={{
                      backgroundColor: isActive ? colorMap.coral : alpha(colorMap.coral100, 0.52),
                      borderColor: isActive ? colorMap.coral : alpha(colorMap.coral, 0.3),
                      color: isActive ? colorMap.coral100 : colorMap.ink800,
                    }}
                    type="button"
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <div
              className="mt-5 border-t pt-4 text-xs uppercase tracking-[0.22em]"
              style={{ borderColor: alpha(colorMap.coral, 0.22), color: colorMap.ink600 }}
            >
              Showing {visiblePosts.length} / {allPosts.length}
            </div>
          </nav>
        </aside>
      </div>
    </section>
  );
}
