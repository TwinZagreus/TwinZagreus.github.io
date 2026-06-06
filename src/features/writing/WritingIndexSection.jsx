"use client";

import { alpha } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TransitionLink from "@/components/TransitionLink";
import { useProjectTheme } from "@/context/ProjectThemeContext";
import {
  getSortedWritingPosts,
  getWritingTags,
} from "@/features/writing/postIndex";

function WritingScrollArea({ children, className = "" }) {
  const scrollRef = useRef(null);
  const [metrics, setMetrics] = useState({ height: 100, isScrollable: false, top: 0 });

  const updateMetrics = useCallback(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const { clientHeight, scrollHeight, scrollTop } = element;
    const isScrollable = scrollHeight > clientHeight + 1;
    if (!isScrollable) {
      setMetrics({ height: 100, isScrollable: false, top: 0 });
      return;
    }

    const height = Math.max(10, (clientHeight / scrollHeight) * 100);
    const top = (scrollTop / (scrollHeight - clientHeight)) * (100 - height);
    setMetrics({ height, isScrollable: true, top });
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return undefined;
    }

    updateMetrics();
    element.addEventListener("scroll", updateMetrics, { passive: true });

    const resizeObserver = new ResizeObserver(updateMetrics);
    resizeObserver.observe(element);

    return () => {
      element.removeEventListener("scroll", updateMetrics);
      resizeObserver.disconnect();
    };
  }, [updateMetrics]);

  return (
    <div className="relative min-h-0">
      <div className={`writing-native-scroll min-h-0 overflow-y-auto ${className}`} ref={scrollRef}>
        {children}
      </div>
      {metrics.isScrollable ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 top-0 w-[10px]"
          style={{ backgroundColor: "var(--writing-scroll-track)" }}
        >
          <div
            className="absolute left-0 right-0"
            style={{
              backgroundColor: "var(--writing-scroll-thumb)",
              boxShadow:
                "inset 0 0 0 1px color-mix(in srgb, var(--writing-scroll-thumb) 72%, white 28%), 0 0 12px color-mix(in srgb, var(--writing-scroll-thumb) 38%, transparent)",
              height: `${metrics.height}%`,
              top: `${metrics.top}%`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function ArticleThumb({ colorMap, index }) {
  const patterns = [
    `radial-gradient(circle at 50% 50%, ${alpha(colorMap.coral, 0.72)} 0 4px, transparent 5px), repeating-radial-gradient(circle at 50% 50%, transparent 0 12px, ${alpha(colorMap.coral, 0.12)} 13px 14px)`,
    `linear-gradient(135deg, ${alpha(colorMap.coral, 0.12)}, transparent), repeating-linear-gradient(160deg, transparent 0 14px, ${alpha(colorMap.coral, 0.12)} 15px 16px)`,
    `radial-gradient(circle at 28% 70%, ${alpha(colorMap.coral, 0.65)} 0 4px, transparent 5px), radial-gradient(circle at 72% 35%, ${alpha(colorMap.coral, 0.55)} 0 4px, transparent 5px), linear-gradient(135deg, ${alpha(colorMap.coral100, 0.8)}, ${alpha(colorMap.coral, 0.12)})`,
  ];

  return (
    <div
      className="relative h-28 w-36 shrink-0 overflow-hidden border"
      style={{
        background: patterns[index % patterns.length],
        borderColor: alpha(colorMap.coral, 0.22),
      }}
    />
  );
}

const FALLBACK_TOPICS = [
  "All",
  "Design",
  "Motion",
  "Code",
  "Notes",
  "UI/UX",
  "Life",
  "Process",
  "Systems",
  "Product",
  "Interaction",
  "Tools",
  "Research",
  "Maps",
  "Data",
  "Visuals",
  "Markdown",
  "Writing",
  "Log",
  "Reflection",
  "Inspiration",
  "Dev",
  "Performance",
  "AI",
  "Web",
  "Creativity",
  "Workflow",
  "Books",
  "Ideas",
  "Prototype",
  "Learning",
  "Case Study",
  "Experiment",
  "Build",
  "Culture",
  "Minimal",
  "Other",
];

function normalizeTagLabel(tag) {
  if (tag === "all") {
    return "All";
  }

  return tag
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getReadMinutes(index) {
  return [6, 5, 4, 7, 5, 3][index % 6];
}

function WritingIndexSection({ className = "" }) {
  const { colorMap } = useProjectTheme();
  const allPosts = useMemo(() => getSortedWritingPosts(), []);
  const allTags = useMemo(() => getWritingTags(), []);
  const topics = useMemo(() => {
    const merged = ["All", ...allTags.map(normalizeTagLabel), ...FALLBACK_TOPICS];
    return [...new Set(merged)];
  }, [allTags]);
  const [activeTag, setActiveTag] = useState("All");
  const visiblePosts = useMemo(() => {
    if (activeTag === "All") {
      return allPosts;
    }

    return allPosts.filter((post) =>
      post.tags.some((tag) => normalizeTagLabel(tag).toLowerCase() === activeTag.toLowerCase()),
    );
  }, [activeTag, allPosts]);

  return (
    <section
      className={`h-full min-h-0 ${className}`}
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
          .writing-native-scroll {
            scrollbar-width: none;
          }

          .writing-native-scroll::-webkit-scrollbar {
            display: none;
            height: 0;
            width: 0;
          }
        `}
      </style>

      <main className="grid h-full min-h-0 grid-cols-[290px_minmax(0,1fr)] gap-2">
        <section
          className="flex min-h-0 flex-col border backdrop-blur-[2px]"
          style={{
            backgroundColor: alpha(colorMap.coral100, 0.42),
            borderColor: alpha(colorMap.coral, 0.22),
          }}
        >
          <div className="px-5 pt-5 text-xs uppercase tracking-[0.28em]" style={{ color: colorMap.ink700 }}>
            Filter by topic
          </div>
          <WritingScrollArea className="h-full p-5 pr-6">
            <div className="flex flex-wrap gap-3">
              {topics.map((topic) => {
                const isActive = topic === activeTag;

                return (
                  <button
                    className="min-w-[4.25rem] border px-4 py-2 text-sm transition duration-200 hover:-translate-y-0.5"
                    key={topic}
                    onClick={() => setActiveTag(topic)}
                    style={{
                      backgroundColor: isActive ? colorMap.coral : alpha(colorMap.coral100, 0.4),
                      borderColor: isActive ? colorMap.coral : alpha(colorMap.coral, 0.24),
                      color: isActive ? colorMap.coral100 : colorMap.ink800,
                    }}
                    type="button"
                  >
                    {topic}
                  </button>
                );
              })}
            </div>
          </WritingScrollArea>
        </section>

        <WritingScrollArea className="h-full pr-5">
          <div className="space-y-2">
            {visiblePosts.map((post, index) => (
              <TransitionLink
                className="group grid grid-cols-[9rem_1fr_auto] items-center gap-7 border p-4 transition duration-200 hover:-translate-y-0.5"
                href={`/writing/${post.slug}`}
                key={post.slug}
                label={post.title}
                style={{
                  backgroundColor: alpha(colorMap.coral100, 0.46),
                  borderColor: alpha(colorMap.coral, 0.22),
                  color: colorMap.ink800,
                }}
              >
                <ArticleThumb colorMap={colorMap} index={index} />
                <div>
                  <h2 className="text-lg font-bold leading-snug tracking-[0.04em]">{post.title}</h2>
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed tracking-[0.08em]" style={{ color: colorMap.ink700 }}>
                    {post.excerpt}
                  </p>
                </div>
                <div className="flex items-center gap-5 text-xs tracking-[0.12em]" style={{ color: colorMap.ink600 }}>
                  <span>{post.date}</span>
                  <span className="h-3 w-px" style={{ backgroundColor: alpha(colorMap.coral, 0.28) }} />
                  <span>{getReadMinutes(index)} min read</span>
                  <span className="grid h-10 w-10 place-items-center border text-xl transition group-hover:translate-x-1" style={{ borderColor: alpha(colorMap.coral, 0.32), color: colorMap.coral }}>
                    →
                  </span>
                </div>
              </TransitionLink>
            ))}
          </div>
        </WritingScrollArea>
      </main>
    </section>
  );
}

export default WritingIndexSection;
