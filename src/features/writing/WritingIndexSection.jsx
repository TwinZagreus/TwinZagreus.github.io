"use client";

import { alpha } from "@mui/material/styles";
import { motion, useReducedMotion } from "framer-motion";
import TransitionLink from "@/components/TransitionLink";
import { useProjectTheme } from "@/context/ProjectThemeContext";
import {
  getRecentWritingPosts,
  getWritingCategories,
} from "@/features/writing/postIndex";

const categoryVariants = {
  hidden: { opacity: 0, y: 28 },
  show: (index) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.07,
      duration: 0.34,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function WritingIndexSection() {
  const isReducedMotion = useReducedMotion();
  const { colorMap } = useProjectTheme();
  const categories = getWritingCategories();
  const recentPosts = getRecentWritingPosts(3);

  return (
    <section
      className="relative z-20 min-h-screen px-5 py-20 sm:px-7 lg:py-24"
      id="writing"
      style={{ color: colorMap.ink950 }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28"
        style={{
          background: `linear-gradient(180deg, ${alpha(colorMap.coral100, 0)} 0%, ${alpha(colorMap.coral100, 0.64)} 74%, ${alpha(colorMap.coral100, 0)} 100%)`,
        }}
      />

      <div className="relative mx-auto grid w-full max-w-[1680px] gap-10 lg:grid-cols-[minmax(260px,0.72fr)_minmax(520px,1.3fr)_minmax(280px,0.72fr)]">
        <motion.header
          className="lg:sticky lg:top-10 lg:h-[calc(100vh-5rem)]"
          initial={isReducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-18%" }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="border-t pt-4 text-[10px] uppercase tracking-[0.36em]"
            style={{ borderColor: alpha(colorMap.neutral700, 0.42), color: colorMap.neutral700 }}
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
            className="mt-8 max-w-sm text-[11px] uppercase leading-relaxed tracking-[0.24em]"
            style={{ color: colorMap.neutral700 }}
          >
            A visual archive for shader studies, motion timing, theme systems, and small interface experiments.
          </p>
        </motion.header>

        <div className="space-y-4">
          {categories.map((group, categoryIndex) => (
            <motion.article
              className="group relative overflow-hidden border px-4 py-5 backdrop-blur-[2px] sm:px-6"
              custom={categoryIndex}
              initial={isReducedMotion ? false : "hidden"}
              key={group.category}
              variants={categoryVariants}
              viewport={{ once: true, margin: "-12%" }}
              whileHover={isReducedMotion ? undefined : { x: 6 }}
              whileInView="show"
              style={{
                backgroundColor: alpha(colorMap.coral100, 0.42),
                borderColor: alpha(colorMap.neutral700, 0.32),
              }}
            >
              <div
                className="absolute inset-y-0 left-0 w-[3px] origin-top scale-y-0 transition-transform duration-300 group-hover:scale-y-100"
                style={{ backgroundColor: colorMap.coral }}
              />
              <div className="grid gap-5 md:grid-cols-[9rem_1fr]">
                <div>
                  <div
                    className="text-[10px] uppercase tracking-[0.32em]"
                    style={{ color: colorMap.neutral600 }}
                  >
                    {String(categoryIndex + 1).padStart(2, "0")}
                  </div>
                  <h3
                    className="mt-3 text-lg uppercase leading-tight tracking-[0.16em]"
                    style={{ color: colorMap.ink800 }}
                  >
                    {group.category}
                  </h3>
                </div>

                <div className="space-y-3">
                  {group.posts.map((post) => (
                    <TransitionLink
                      className="block border-t pt-3 outline-none transition-transform duration-200 hover:translate-x-2 focus-visible:translate-x-2"
                      href={`/writing/${post.slug}`}
                      key={post.slug}
                      label={post.title}
                      style={{ borderColor: alpha(colorMap.neutral700, 0.24) }}
                    >
                      <div className="flex items-start justify-between gap-5">
                        <div>
                          <h4
                            className="text-base uppercase leading-snug tracking-[0.12em] transition-colors"
                            style={{ color: colorMap.ink700 }}
                          >
                            {post.title}
                          </h4>
                          <p
                            className="mt-2 max-w-xl text-[11px] uppercase leading-relaxed tracking-[0.2em]"
                            style={{ color: colorMap.neutral700 }}
                          >
                            {post.excerpt}
                          </p>
                        </div>
                        <span
                          className="shrink-0 text-[10px] uppercase tracking-[0.22em]"
                          style={{ color: colorMap.neutral600 }}
                        >
                          {post.date}
                        </span>
                      </div>
                    </TransitionLink>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-10 lg:h-[calc(100vh-5rem)]">
          <section
            className="border p-5 backdrop-blur-[2px]"
            style={{
              backgroundColor: alpha(colorMap.coral100, 0.5),
              borderColor: alpha(colorMap.neutral700, 0.34),
            }}
          >
            <div
              className="border-t pt-4 text-[10px] uppercase tracking-[0.32em]"
              style={{ borderColor: alpha(colorMap.neutral700, 0.38), color: colorMap.neutral700 }}
            >
              Recently updated
            </div>
            <div className="mt-5 space-y-4">
              {recentPosts.map((post) => (
                <TransitionLink
                  className="block outline-none transition-transform duration-200 hover:translate-x-1 focus-visible:translate-x-1"
                  href={`/writing/${post.slug}`}
                  key={post.slug}
                  label={post.title}
                >
                  <div
                    className="text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: colorMap.neutral600 }}
                  >
                    {post.date}
                  </div>
                  <h3
                    className="mt-2 text-sm uppercase leading-snug tracking-[0.16em]"
                    style={{ color: colorMap.ink700 }}
                  >
                    {post.title}
                  </h3>
                </TransitionLink>
              ))}
            </div>
          </section>

          <nav
            aria-label="Writing table of contents"
            className="border p-5 backdrop-blur-[2px]"
            style={{
              backgroundColor: alpha(colorMap.coral100, 0.36),
              borderColor: alpha(colorMap.neutral700, 0.3),
            }}
          >
            <div
              className="text-[10px] uppercase tracking-[0.32em]"
              style={{ color: colorMap.neutral700 }}
            >
              Complete map
            </div>
            <div className="mt-5 space-y-5">
              {categories.map((group) => (
                <div key={group.category}>
                  <div
                    className="text-[10px] uppercase tracking-[0.24em]"
                    style={{ color: colorMap.ink700 }}
                  >
                    {group.category}
                  </div>
                  <div className="mt-2 space-y-2">
                    {group.posts.map((post) => (
                      <TransitionLink
                        className="block text-[11px] uppercase leading-snug tracking-[0.18em] opacity-80 transition hover:translate-x-1 hover:opacity-100"
                        href={`/writing/${post.slug}`}
                        key={post.slug}
                        label={post.title}
                        style={{ color: colorMap.neutral700 }}
                      >
                        {post.title}
                      </TransitionLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </aside>
      </div>
    </section>
  );
}
