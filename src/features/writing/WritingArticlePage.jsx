"use client";

import { alpha } from "@mui/material/styles";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { HomeLeftRail, HomeRightRail } from "@/components/HomeSideRails";
import TransitionLink from "@/components/TransitionLink";
import { useProjectTheme } from "@/context/ProjectThemeContext";

const MAP_HERO_VARIANT_COUNT = 3;

function formatDateLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-CA");
}

function normalizeHeadingText(value) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function getHeadingId(index, text) {
  const safeText = text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);

  return `article-heading-${index}-${safeText || "section"}`;
}

function isTableSeparator(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function getArticleSections(content, titleToSkip = "") {
  const sections = [];
  const lines = content.split(/\r?\n/);
  let index = 0;
  let headingCount = 0;

  const shouldStopParagraph = (line) => {
    const trimmed = line.trim();
    return (
      !trimmed ||
      /^#{1,6}\s+/.test(trimmed) ||
      /^(\s*)([-*+]|\d+\.)\s+/.test(line) ||
      /^>\s?/.test(trimmed) ||
      /^```/.test(trimmed) ||
      trimmed === "$$" ||
      trimmed.startsWith("$$") ||
      trimmed === "\\[" ||
      /^(\*\s*){3,}$/.test(trimmed) ||
      /^(-\s*){3,}$/.test(trimmed) ||
      /^(_\s*){3,}$/.test(trimmed) ||
      (trimmed.includes("|") && isTableSeparator(lines[index + 1] ?? ""))
    );
  };

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (/^```/.test(trimmed)) {
      const language = trimmed.replace(/^```/, "").trim();
      const codeLines = [];
      index += 1;

      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        codeLines.push(lines[index]);
        index += 1;
      }

      sections.push({ code: codeLines.join("\n"), language, type: "code" });
      index += 1;
      continue;
    }

    if (trimmed === "$$" || trimmed.startsWith("$$")) {
      const mathLines = [];

      if (trimmed.length > 2 && trimmed.endsWith("$$")) {
        mathLines.push(trimmed.slice(2, -2).trim());
      } else {
        if (trimmed.length > 2) {
          mathLines.push(trimmed.slice(2).trim());
        }
        index += 1;
        while (index < lines.length && lines[index].trim() !== "$$") {
          mathLines.push(lines[index]);
          index += 1;
        }
      }

      sections.push({ text: mathLines.join("\n").trim(), type: "math" });
      index += 1;
      continue;
    }

    if (trimmed === "\\[") {
      const mathLines = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== "\\]") {
        mathLines.push(lines[index]);
        index += 1;
      }
      sections.push({ text: mathLines.join("\n").trim(), type: "math" });
      index += 1;
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      if (
        level === 1 &&
        normalizeHeadingText(text) === normalizeHeadingText(titleToSkip)
      ) {
        index += 1;
        continue;
      }
      headingCount += 1;
      sections.push({
        id: getHeadingId(headingCount, text),
        index: headingCount,
        level,
        text,
        type: "heading",
      });
      index += 1;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      sections.push({ text: quoteLines.join(" "), type: "quote" });
      continue;
    }

    const listMatch = /^(\s*)([-*+]|\d+\.)\s+(.+)$/.exec(line);
    if (listMatch) {
      const items = [];
      while (index < lines.length) {
        const currentMatch = /^(\s*)([-*+]|\d+\.)\s+(.+)$/.exec(lines[index]);
        if (!currentMatch) {
          break;
        }
        const indent = currentMatch[1].replace(/\t/g, "  ").length;
        const marker = currentMatch[2];
        items.push({
          level: Math.floor(indent / 2),
          ordered: /\d+\./.test(marker),
          text: currentMatch[3].trim(),
        });
        index += 1;
      }
      sections.push({ items, type: "list" });
      continue;
    }

    if (
      trimmed.includes("|") &&
      isTableSeparator(lines[index + 1] ?? "")
    ) {
      const headers = parseTableRow(trimmed);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].trim().includes("|")) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }
      sections.push({ headers, rows, type: "table" });
      continue;
    }

    if (
      /^(\*\s*){3,}$/.test(trimmed) ||
      /^(-\s*){3,}$/.test(trimmed) ||
      /^(_\s*){3,}$/.test(trimmed)
    ) {
      sections.push({ type: "divider" });
      index += 1;
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;
    while (index < lines.length && !shouldStopParagraph(lines[index])) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    sections.push({ text: paragraphLines.join(" "), type: "p" });
  }

  return sections;
}

function CalendarIcon({ color }) {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M7 4V7M17 4V7M5.5 9.5H18.5M6 6H18C19.1 6 20 6.9 20 8V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V8C4 6.9 4.9 6 6 6Z" stroke={color} strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function FolderIcon({ color }) {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M4 7.2C4 6.54 4.54 6 5.2 6H10L12 8H18.8C19.46 8 20 8.54 20 9.2V17.8C20 18.46 19.46 19 18.8 19H5.2C4.54 19 4 18.46 4 17.8V7.2Z" stroke={color} strokeLinejoin="round" strokeWidth="1.55" />
    </svg>
  );
}

function MapTexture({ colorMap }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full opacity-45"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path d="M-5 16C10 6 16 23 29 13C43 2 46 12 55 8C70 0 75 14 105 4" stroke={alpha(colorMap.ink950, 0.22)} strokeWidth="0.18" />
        <path d="M-3 50C9 42 17 55 29 46C43 36 56 48 67 40C82 30 91 44 104 34" stroke={alpha(colorMap.ink950, 0.18)} strokeWidth="0.16" />
        <path d="M-6 83C7 76 17 87 30 78C43 70 54 84 69 74C82 66 93 76 107 70" stroke={alpha(colorMap.ink950, 0.18)} strokeWidth="0.16" />
        <path d="M16 -8C7 8 20 19 12 33C4 48 18 59 10 74C3 88 16 96 9 108" stroke={alpha(colorMap.ink950, 0.18)} strokeWidth="0.15" />
        <path d="M73 -4C66 11 79 21 70 36C61 52 75 64 68 80C62 94 76 101 71 108" stroke={alpha(colorMap.ink950, 0.2)} strokeWidth="0.16" />
      </svg>
      <span className="absolute left-[7%] top-[12%] text-xl leading-none" style={{ color: alpha(colorMap.coral, 0.65) }}>+</span>
      <span className="absolute right-[8%] top-[28%] text-xl leading-none" style={{ color: alpha(colorMap.coral, 0.48) }}>+</span>
      <span className="absolute bottom-[10%] left-[46%] text-xl leading-none" style={{ color: alpha(colorMap.coral, 0.42) }}>+</span>
    </div>
  );
}

function ArticleMapArtwork({ colorMap, variant }) {
  if (variant === 1) {
    return (
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 1000 236"
      >
        <path d="M-40 164C90 92 184 141 282 98C381 54 480 88 590 66C722 40 822 74 1040 18" stroke={alpha(colorMap.coral, 0.34)} strokeLinecap="round" strokeWidth="1.15" />
        <path d="M-20 183C115 124 205 162 302 122C412 77 506 111 612 90C738 65 854 95 1030 48" stroke={alpha(colorMap.ink950, 0.2)} strokeLinecap="round" strokeWidth="0.9" />
        <path d="M-16 205C98 165 210 184 325 150C430 119 530 146 654 119C790 89 890 118 1020 86" stroke={alpha(colorMap.ink950, 0.13)} strokeLinecap="round" strokeWidth="0.7" />
        <path d="M84 52C150 22 217 27 278 56C334 82 388 71 446 50C523 22 594 27 650 62" stroke={alpha(colorMap.coral, 0.2)} strokeDasharray="5 11" strokeLinecap="round" strokeWidth="1" />
        <path d="M723 136C755 111 797 113 828 139C856 162 900 160 936 138" stroke={alpha(colorMap.coral, 0.24)} strokeDasharray="3 9" strokeLinecap="round" strokeWidth="1" />
        <circle cx="188" cy="116" r="8" stroke={alpha(colorMap.coral, 0.56)} strokeWidth="1.2" />
        <circle cx="188" cy="116" r="22" stroke={alpha(colorMap.coral, 0.22)} strokeWidth="0.8" />
        <circle cx="188" cy="116" r="3" fill={alpha(colorMap.coral, 0.76)} />
        <circle cx="676" cy="82" r="10" stroke={alpha(colorMap.coral, 0.42)} strokeWidth="1.1" />
        <circle cx="676" cy="82" r="34" stroke={alpha(colorMap.coral, 0.16)} strokeWidth="0.8" />
        <path d="M645 82H707M676 51V113" stroke={alpha(colorMap.coral, 0.2)} strokeWidth="0.8" />
        <path d="M850 81L890 102L812 116Z" fill={alpha(colorMap.coral, 0.18)} stroke={alpha(colorMap.coral, 0.36)} strokeWidth="1" />
      </svg>
    );
  }

  if (variant === 2) {
    return (
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 1000 236"
      >
        <path d="M-30 50C70 108 143 35 247 86C337 130 431 61 535 100C644 141 723 75 835 116C912 145 963 118 1030 87" stroke={alpha(colorMap.ink950, 0.18)} strokeLinecap="round" strokeWidth="0.95" />
        <path d="M-30 77C74 130 147 66 251 111C345 152 430 93 538 126C650 161 719 104 834 143C918 171 961 146 1030 118" stroke={alpha(colorMap.ink950, 0.14)} strokeLinecap="round" strokeWidth="0.75" />
        <path d="M-30 105C81 151 151 94 262 134C363 170 445 122 546 150C658 182 732 132 847 162C922 182 972 166 1030 143" stroke={alpha(colorMap.coral, 0.28)} strokeDasharray="4 10" strokeLinecap="round" strokeWidth="1" />
        <path d="M42 178C126 139 209 165 302 145C390 126 457 165 551 140C651 113 739 151 830 126C905 106 955 127 1038 96" stroke={alpha(colorMap.ink950, 0.16)} strokeLinecap="round" strokeWidth="0.8" />
        <circle cx="500" cy="118" r="18" stroke={alpha(colorMap.coral, 0.22)} strokeWidth="0.8" />
        <circle cx="500" cy="118" r="40" stroke={alpha(colorMap.coral, 0.16)} strokeWidth="0.8" />
        <circle cx="500" cy="118" r="64" stroke={alpha(colorMap.coral, 0.1)} strokeWidth="0.8" />
        <circle cx="500" cy="118" r="3" fill={alpha(colorMap.coral, 0.72)} />
        <path d="M86 56L86 188M166 42L166 196M246 60L246 184M326 48L326 204M406 58L406 192M586 52L586 194M666 42L666 202M746 58L746 186M826 48L826 198M906 62L906 182" stroke={alpha(colorMap.ink950, 0.055)} strokeWidth="0.7" />
        <path d="M70 174L170 106L246 146L330 90L430 132L525 74L622 130L735 84L842 124L928 72" stroke={alpha(colorMap.coral, 0.24)} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 1000 236"
    >
      <path d="M0 170C92 154 144 132 218 156C292 180 355 126 438 148C525 171 600 204 690 166C789 130 854 145 1000 102" stroke={alpha(colorMap.coral, 0.38)} strokeDasharray="4 9" strokeLinecap="round" strokeWidth="1.2" />
      <path d="M0 194C115 174 163 151 250 176C326 198 384 154 466 176C555 200 641 222 728 188C814 155 890 169 1000 132" stroke={alpha(colorMap.ink950, 0.2)} strokeWidth="1" />
      <path d="M0 210C116 190 169 171 245 192C330 216 395 177 475 196C566 216 660 230 748 204C835 176 897 187 1000 154" stroke={alpha(colorMap.ink950, 0.14)} strokeWidth="0.75" />
      <circle cx="730" cy="92" r="8" stroke={alpha(colorMap.coral, 0.42)} strokeWidth="1.2" />
      <circle cx="730" cy="92" r="25" stroke={alpha(colorMap.coral, 0.2)} strokeWidth="0.8" />
      <circle cx="730" cy="92" r="44" stroke={alpha(colorMap.coral, 0.12)} strokeWidth="0.8" />
      <circle cx="730" cy="92" r="3" fill={alpha(colorMap.coral, 0.7)} />
      <circle cx="205" cy="128" r="7" stroke={alpha(colorMap.coral, 0.5)} strokeWidth="1.2" />
      <circle cx="205" cy="128" r="3" fill={alpha(colorMap.coral, 0.7)} />
      <path d="M205 128C284 106 320 89 382 106" stroke={alpha(colorMap.coral, 0.3)} strokeDasharray="3 7" strokeWidth="1" />
      <path d="M894 122L916 147L875 154Z" fill={alpha(colorMap.coral, 0.22)} stroke={alpha(colorMap.coral, 0.42)} strokeWidth="1" />
    </svg>
  );
}

function ArticleMapHero({ colorMap, variant }) {
  return (
    <div
      className="relative mt-8 h-[clamp(200px,22vw,268px)] overflow-hidden rounded-[4px] border"
      style={{
        background:
          `linear-gradient(180deg, ${alpha(colorMap.coral100, 0.66)}, ${alpha(colorMap.neutral100, 0.52)}), ` +
          `repeating-linear-gradient(0deg, ${alpha(colorMap.ink950, 0.035)} 0 1px, transparent 1px 8px), ` +
          `repeating-linear-gradient(90deg, ${alpha(colorMap.ink950, 0.025)} 0 1px, transparent 1px 12px)`,
        borderColor: alpha(colorMap.coral, 0.2),
      }}
    >
      <MapTexture colorMap={colorMap} />
      <ArticleMapArtwork colorMap={colorMap} variant={variant} />
    </div>
  );
}

function sanitizeHref(href) {
  const value = href.trim().replace(/\\/g, "/");
  if (/^(javascript:|data:|vbscript:)/i.test(value)) {
    return "#";
  }
  return value;
}

function renderInlineContent(text, colorMap, keyPrefix = "inline") {
  const parts = [];
  const pattern =
    /(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[\s\S]+?\*\*|==[\s\S]+?==|<strong>[\s\S]+?<\/strong>|\$[^$\n]+\$|\\\([^)]+\\\))/gi;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${match.index}`;
    const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);

    if (linkMatch) {
      const href = sanitizeHref(linkMatch[2]);
      const isExternal = /^https?:/i.test(href);
      parts.push(
        <a
          className="border-b transition hover:opacity-70"
          href={href}
          key={key}
          rel={isExternal ? "noreferrer" : undefined}
          style={{
            borderColor: alpha(colorMap.coral, 0.38),
            color: colorMap.coral,
          }}
          target={isExternal ? "_blank" : undefined}
        >
          {linkMatch[1]}
        </a>,
      );
    } else if (token.startsWith("`")) {
      parts.push(
        <code
          className="rounded-[3px] px-1.5 py-0.5 font-mono text-[0.92em]"
          key={key}
          style={{
            backgroundColor: alpha(colorMap.coral100, 0.62),
            color: colorMap.ink950,
          }}
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      parts.push(
        <strong className="font-bold" key={key} style={{ color: colorMap.ink950 }}>
          {renderInlineContent(token.slice(2, -2), colorMap, key)}
        </strong>,
      );
    } else if (/^<strong>/i.test(token)) {
      parts.push(
        <strong className="font-bold" key={key} style={{ color: colorMap.ink950 }}>
          {renderInlineContent(token.replace(/^<strong>/i, "").replace(/<\/strong>$/i, ""), colorMap, key)}
        </strong>,
      );
    } else if (token.startsWith("==")) {
      parts.push(
        <mark
          className="rounded-[3px] px-1"
          key={key}
          style={{
            backgroundColor: alpha(colorMap.coral, 0.16),
            color: colorMap.ink950,
          }}
        >
          {renderInlineContent(token.slice(2, -2), colorMap, key)}
        </mark>,
      );
    } else {
      const mathText = token.startsWith("\\(") ? token.slice(2, -2) : token.slice(1, -1);
      parts.push(
        <span
          className="rounded-[3px] px-1.5 py-0.5 font-mono text-[0.9em]"
          key={key}
          style={{
            backgroundColor: alpha(colorMap.ink950, 0.06),
            color: colorMap.ink800,
          }}
        >
          {mathText}
        </span>,
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function ArticleStructureRail({
  colorMap,
  headings,
  isHidden,
  isReducedMotion,
  onToggle,
}) {
  if (!headings.length) {
    return null;
  }

  const handleJump = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: isReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <>
      <button
        aria-expanded={!isHidden}
        aria-label={isHidden ? "Show article structure" : "Hide article structure"}
        className="absolute left-3 top-4 z-30 hidden h-9 w-9 place-items-center border text-[13px] font-bold transition duration-200 hover:-translate-y-0.5 lg:grid"
        onClick={onToggle}
        style={{
          backgroundColor: alpha(colorMap.coral100, 0.72),
          borderColor: alpha(colorMap.coral, 0.32),
          color: colorMap.coral,
        }}
        type="button"
      >
        {isHidden ? "≡" : "×"}
      </button>

      <nav
        aria-label="Article structure"
        className={`article-structure-rail relative hidden min-h-0 overflow-hidden border-r transition duration-300 ease-out lg:block ${
          isHidden ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        style={{
          backgroundColor: alpha(colorMap.coral100, 0.26),
          borderColor: alpha(colorMap.ink950, 0.1),
          transform: isHidden ? "translateX(-10px)" : "translateX(0)",
        }}
      >
        <div className="flex h-full min-h-0 flex-col px-5 pb-7 pt-16">
          <div className="mb-4 flex items-center justify-between gap-4">
            <span
              className="text-[11px] font-bold uppercase tracking-[0.24em]"
              style={{ color: colorMap.coral }}
            >
              Structure
            </span>
            <span
              className="h-px flex-1"
              style={{ backgroundColor: alpha(colorMap.coral, 0.2) }}
            />
          </div>

          <div className="structure-native-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {headings.map((heading) => (
              <button
                className="group grid w-full grid-cols-[1.8rem_1fr] items-start gap-3 border-l px-3 py-2 text-left transition duration-200 hover:translate-x-1"
                key={heading.id}
                onClick={() => handleJump(heading.id)}
                style={{
                  borderColor: alpha(colorMap.coral, heading.level === 2 ? 0.56 : 0.22),
                  color: colorMap.ink800,
                  paddingLeft: `${Math.max(0, heading.level - 2) * 12 + 12}px`,
                }}
                type="button"
              >
                <span
                  className="font-mono text-[10px] leading-5"
                  style={{ color: colorMap.coral }}
                >
                  {String(heading.index).padStart(2, "0")}
                </span>
                <span className="text-[11px] font-semibold uppercase leading-5 tracking-[0.13em] transition group-hover:opacity-75">
                  {heading.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}

function MarkdownBody({ sections }) {
  const { colorMap } = useProjectTheme();

  return (
    <div className="mt-8 space-y-8">
      {sections.map((section, index) => {
        if (section.type === "heading") {
          const HeadingTag = `h${Math.min(section.level, 6)}`;
          const isPrimary = section.level <= 2;

          return (
            <section
              className={isPrimary ? "grid scroll-mt-8 gap-5 border-t pt-7 sm:grid-cols-[44px_1fr]" : "scroll-mt-8"}
              id={section.id}
              key={`${section.type}-${index}`}
              style={{ borderColor: alpha(colorMap.ink950, 0.12) }}
            >
              {isPrimary ? (
                <div
                  className="grid h-10 w-10 place-items-center rounded-full border text-[12px] font-bold"
                  style={{
                    backgroundColor: alpha(colorMap.coral100, 0.36),
                    borderColor: alpha(colorMap.coral, 0.42),
                    color: colorMap.ink800,
                  }}
                >
                  {String(section.index).padStart(2, "0")}
                </div>
              ) : null}
              <div>
                <HeadingTag
                  className={
                    isPrimary
                      ? "text-[clamp(1.25rem,2vw,1.7rem)] font-semibold leading-snug tracking-[0.04em]"
                      : section.level === 3
                        ? "text-[15px] font-bold uppercase leading-tight tracking-[0.16em]"
                        : "text-[13px] font-bold uppercase leading-tight tracking-[0.14em]"
                  }
                  style={{
                    color: isPrimary ? colorMap.ink950 : colorMap.ink800,
                    fontFamily: '"Georgia", "Noto Serif SC", serif',
                  }}
                >
                  {renderInlineContent(section.text, colorMap, `${section.id}-title`)}
                </HeadingTag>
              </div>
            </section>
          );
        }

        if (section.type === "list") {
          return (
            <ul className="space-y-3" key={`${section.type}-${index}`}>
              {section.items.map((item, itemIndex) => (
                <li
                  className="grid grid-cols-[1.75rem_1fr] text-[15px] leading-8"
                  key={`${item}-${itemIndex}`}
                  style={{
                    color: colorMap.ink800,
                    marginLeft: `${item.level * 22}px`,
                  }}
                >
                  <span
                    className="font-mono text-[12px]"
                    style={{ color: colorMap.coral }}
                  >
                    {item.ordered ? `${itemIndex + 1}.` : "+"}
                  </span>
                  <span>{renderInlineContent(item.text, colorMap, `${section.type}-${index}-${itemIndex}`)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (section.type === "quote") {
          return (
            <blockquote
              className="relative rounded-[4px] border px-7 py-5 text-[15px] leading-8"
              key={`${section.type}-${index}`}
              style={{
                backgroundColor: alpha(colorMap.coral100, 0.44),
                borderColor: alpha(colorMap.coral, 0.2),
                color: colorMap.ink800,
              }}
            >
              <span
                className="absolute -left-3 top-4 grid h-8 w-8 place-items-center rounded-full text-2xl"
                style={{
                  backgroundColor: colorMap.coral100,
                  color: colorMap.coral,
                }}
              >
                &ldquo;
              </span>
              {renderInlineContent(section.text, colorMap, `${section.type}-${index}`)}
            </blockquote>
          );
        }

        if (section.type === "code") {
          return (
            <div
              className="overflow-hidden rounded-[4px] border"
              key={`${section.type}-${index}`}
              style={{
                backgroundColor: alpha(colorMap.ink950, 0.075),
                borderColor: alpha(colorMap.coral, 0.18),
              }}
            >
              {section.language ? (
                <div
                  className="border-b px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em]"
                  style={{
                    borderColor: alpha(colorMap.coral, 0.16),
                    color: colorMap.coral,
                  }}
                >
                  {section.language}
                </div>
              ) : null}
              <pre className="overflow-x-auto p-4 text-[13px] leading-7">
                <code style={{ color: colorMap.ink900 }}>{section.code}</code>
              </pre>
            </div>
          );
        }

        if (section.type === "math") {
          return (
            <pre
              className="overflow-x-auto rounded-[4px] border px-5 py-4 text-center font-mono text-[13px] leading-7"
              key={`${section.type}-${index}`}
              style={{
                backgroundColor: alpha(colorMap.coral100, 0.46),
                borderColor: alpha(colorMap.coral, 0.22),
                color: colorMap.ink900,
              }}
            >
              {section.text}
            </pre>
          );
        }

        if (section.type === "table") {
          return (
            <div className="overflow-x-auto" key={`${section.type}-${index}`}>
              <table
                className="min-w-full border-collapse text-left text-[13px]"
                style={{ color: colorMap.ink800 }}
              >
                <thead>
                  <tr>
                    {section.headers.map((header, headerIndex) => (
                      <th
                        className="border-b px-4 py-3 font-bold uppercase tracking-[0.12em]"
                        key={`${header}-${headerIndex}`}
                        style={{
                          borderColor: alpha(colorMap.coral, 0.26),
                          color: colorMap.ink950,
                        }}
                      >
                        {renderInlineContent(header, colorMap, `${section.type}-${index}-head-${headerIndex}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row, rowIndex) => (
                    <tr key={`row-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td
                          className="border-b px-4 py-3 leading-7"
                          key={`${cell}-${cellIndex}`}
                          style={{ borderColor: alpha(colorMap.ink950, 0.1) }}
                        >
                          {renderInlineContent(cell, colorMap, `${section.type}-${index}-cell-${rowIndex}-${cellIndex}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (section.type === "divider") {
          return (
            <div className="flex items-center gap-3" key={`${section.type}-${index}`}>
              <span className="h-px flex-1" style={{ backgroundColor: alpha(colorMap.ink950, 0.12) }} />
              <span className="text-lg leading-none" style={{ color: colorMap.coral }}>+</span>
              <span className="h-px flex-1" style={{ backgroundColor: alpha(colorMap.ink950, 0.12) }} />
            </div>
          );
        }

        return (
          <p
            className="max-w-[86ch] text-[15px] leading-8 tracking-[0.04em]"
            key={`${section.type}-${index}`}
            style={{ color: colorMap.ink800 }}
          >
            {renderInlineContent(section.text, colorMap, `${section.type}-${index}`)}
          </p>
        );
      })}
    </div>
  );
}

export default function WritingArticlePage({ post, recentPosts = [] }) {
  const isReducedMotion = useReducedMotion();
  const { colorMap } = useProjectTheme();
  const sections = useMemo(
    () => getArticleSections(post.content, post.title),
    [post.content, post.title],
  );
  const headings = useMemo(
    () => sections.filter((section) => section.type === "heading"),
    [sections],
  );
  const articleScrollRef = useRef(null);
  const [mapVariant, setMapVariant] = useState(0);
  const [isStructureHidden, setIsStructureHidden] = useState(false);
  const [scrollState, setScrollState] = useState({
    canScroll: false,
    progress: 0,
  });

  useEffect(() => {
    setMapVariant(Math.floor(Math.random() * MAP_HERO_VARIANT_COUNT));
  }, [post.slug]);

  useEffect(() => {
    const scrollNode = articleScrollRef.current;
    if (!scrollNode) {
      return undefined;
    }

    const updateScrollState = () => {
      const maxScroll = scrollNode.scrollHeight - scrollNode.clientHeight;
      const canScroll = maxScroll > 1;
      const progress = canScroll ? scrollNode.scrollTop / maxScroll : 0;

      setScrollState({
        canScroll,
        progress: Math.min(Math.max(progress, 0), 1),
      });
    };

    updateScrollState();
    scrollNode.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      scrollNode.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [post.slug]);

  return (
    <main className="relative z-10 h-screen h-[100dvh] overflow-hidden px-4 py-8 sm:px-7 lg:px-9">
      <style>
        {`
          .writing-article-scroll {
            scrollbar-width: none;
          }

          .writing-article-scroll::-webkit-scrollbar {
            display: none;
            height: 0;
            width: 0;
          }

          .structure-native-scroll {
            scrollbar-width: none;
          }

          .structure-native-scroll::-webkit-scrollbar {
            display: none;
            height: 0;
            width: 0;
          }
        `}
      </style>
      <motion.div
        className="relative mx-auto grid h-full min-h-0 w-full max-w-[1840px] gap-8 min-[1500px]:grid-cols-[260px_minmax(0,1fr)_360px]"
        initial={isReducedMotion ? false : { opacity: 0, y: 28 }}
        animate={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <HomeLeftRail className="h-full overflow-hidden max-xl:hidden" />

        <section
          className="relative flex h-full min-h-0 flex-col overflow-hidden border shadow-xl backdrop-blur-[2px]"
          style={{
            backgroundColor: alpha(colorMap.coral100, 0.62),
            borderColor: alpha(colorMap.coral, 0.22),
            boxShadow: `0 28px 80px ${alpha(colorMap.ink950, 0.12)}`,
            color: colorMap.ink950,
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-8 right-0 top-[4.75rem] z-20 w-5"
          >
            <span
              className="absolute bottom-0 right-[9px] top-0 w-px"
              style={{ backgroundColor: alpha(colorMap.coral, 0.22) }}
            />
            <span
              className="absolute right-[7px] h-[clamp(76px,16vh,150px)] w-1"
              style={{
                backgroundColor: colorMap.coral,
                boxShadow: `0 0 18px ${alpha(colorMap.coral, 0.18)}`,
                opacity: scrollState.canScroll ? 1 : 0.46,
                top: `${scrollState.progress * 100}%`,
                transform: `translateY(-${scrollState.progress * 100}%)`,
              }}
            />
          </div>

          <div
            className="relative z-10 shrink-0 border-b px-5 pb-4 pt-9 sm:px-10 lg:px-12 xl:px-14"
            style={{ borderColor: alpha(colorMap.ink950, 0.08) }}
          >
            <TransitionLink
              className="inline-flex items-center gap-3 border px-3 py-2 text-[13px] font-bold uppercase tracking-[0.2em] transition duration-200 ease-out hover:-translate-x-1"
              href="/#writing"
              label="Back to notes"
              style={{
                backgroundColor: alpha(colorMap.coral100, 0.54),
                borderColor: alpha(colorMap.coral, 0.34),
                color: colorMap.coral,
              }}
            >
              <span aria-hidden="true" className="text-[16px] leading-none">&larr;</span>
              Back to notes
            </TransitionLink>
          </div>

          <div
            className="relative z-10 min-h-0 flex-1 overflow-hidden lg:grid"
            style={{
              gridTemplateColumns: isStructureHidden
                ? "0px minmax(0, 1fr)"
                : "clamp(210px, 18vw, 280px) minmax(0, 1fr)",
            }}
          >
            <ArticleStructureRail
              colorMap={colorMap}
              headings={headings}
              isHidden={isStructureHidden}
              isReducedMotion={isReducedMotion}
              onToggle={() => setIsStructureHidden((current) => !current)}
            />

            <article
              className="writing-article-scroll relative z-10 h-full min-h-0 overflow-y-auto overscroll-contain px-5 pb-9 pt-4 sm:px-10 lg:px-12 xl:px-14"
              ref={articleScrollRef}
            >
              <div className="relative">
              <header>
              <h1
                className="max-w-[980px] text-[clamp(2.25rem,4.3vw,4.5rem)] font-semibold leading-[1.05] tracking-[0.02em]"
                style={{
                  color: colorMap.ink950,
                  fontFamily: '"Georgia", "Noto Serif SC", serif',
                }}
              >
                {post.title}
              </h1>
              <p className="mt-4 max-w-3xl text-[15px] leading-7 tracking-[0.08em]" style={{ color: colorMap.ink800 }}>
                {post.excerpt}
              </p>

              <div
                className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-b pb-5 text-[12px] font-semibold tracking-[0.12em]"
                style={{
                  borderColor: alpha(colorMap.ink950, 0.12),
                  color: colorMap.ink800,
                }}
              >
                <span className="inline-flex items-center gap-3">
                  <CalendarIcon color={colorMap.coral} />
                  {formatDateLabel(post.date)}
                </span>
                <span className="inline-flex items-center gap-3">
                  <FolderIcon color={colorMap.coral} />
                  {post.category}
                </span>
                <span className="ml-auto text-[11px] uppercase tracking-[0.22em]" style={{ color: colorMap.coral }}>
                  {post.tags?.[0] ?? "Lifestyle"} / 写作
                </span>
              </div>
              </header>

            <ArticleMapHero colorMap={colorMap} variant={mapVariant} />

            <p className="mt-7 max-w-[92ch] text-[16px] leading-8 tracking-[0.04em]" style={{ color: colorMap.ink800 }}>
              {post.excerpt}
            </p>

            <div className="my-7 flex items-center gap-4">
              <span className="h-px flex-1" style={{ backgroundColor: alpha(colorMap.ink950, 0.12) }} />
              <span className="text-lg leading-none" style={{ color: colorMap.coral }}>+</span>
              <span className="h-px flex-1" style={{ backgroundColor: alpha(colorMap.ink950, 0.12) }} />
            </div>

            <MarkdownBody sections={sections} />
              </div>
            </article>
          </div>
        </section>

        <HomeRightRail
          className="h-full overflow-hidden max-xl:hidden"
          recentPosts={recentPosts}
        />
      </motion.div>
    </main>
  );
}
