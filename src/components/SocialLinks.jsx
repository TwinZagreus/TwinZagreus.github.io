"use client";

import { alpha } from "@mui/material/styles";
import { motion, useReducedMotion } from "framer-motion";
import { useProjectTheme } from "@/context/ProjectThemeContext";
import { MAIN_BACKGROUND_COLOR } from "@/lib/theme";

const SOCIAL_LINKS = Object.freeze([
  {
    href: "https://space.bilibili.com/69861123?spm_id_from=333.337.0.0",
    icon: "bilibili",
    label: "Bilibili",
  },
  {
    href: "https://github.com/TwinZagreus",
    icon: "github",
    label: "GitHub",
  },
  {
    href: "https://steamcommunity.com/id/543150640/",
    icon: "steam",
    label: "Steam",
  },
]);

function SocialIcon({ name }) {
  if (name === "bilibili") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="M8.2 5.2 6.4 3.4M15.8 5.2l1.8-1.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        <rect height="13.2" rx="3.2" stroke="currentColor" strokeWidth="1.8" width="18" x="3" y="6.5" />
        <path d="M9 12.2v1.1M15 12.2v1.1M10 16h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "github") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path
          d="M9.2 19.6c-4.2 1.1-4.2-2-5.8-2.4m11.6 4v-3.1c0-.9.3-1.5.7-1.9 2.4-.3 4.9-1.2 4.9-5.4 0-1.2-.4-2.2-1.1-3 .1-.3.5-1.5-.1-3-1 0-3.1 1.2-3.1 1.2a10.5 10.5 0 0 0-5.6 0s-2.1-1.2-3.1-1.2c-.6 1.5-.2 2.7-.1 3a4.2 4.2 0 0 0-1.1 3c0 4.2 2.5 5.1 4.9 5.4.3.3.6.8.6 1.5v3.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M8.2 14.8 3.8 13a2.9 2.9 0 0 0 5.6 1.8l4.2 1.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <circle cx="16.7" cy="7.5" r="4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16.7" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m10.2 13.4 3.1-2.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

export default function SocialLinks() {
  const isReducedMotion = useReducedMotion();
  const { colorMap } = useProjectTheme();

  return (
    <nav aria-label="Social links" className="pointer-events-auto relative z-30 mt-5 flex flex-wrap gap-3">
      {SOCIAL_LINKS.map((link, index) => (
        <motion.a
          className="group inline-flex h-11 items-center gap-2 rounded-full border px-3.5 text-xs uppercase tracking-[0.16em] shadow-sm backdrop-blur-[2px] transition-colors duration-200"
          href={link.href}
          initial={false}
          key={link.label}
          rel="noreferrer"
          target="_blank"
          transition={{ delay: index * 0.04, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          whileHover={isReducedMotion ? undefined : { y: -3 }}
          style={{
            backgroundColor: alpha(MAIN_BACKGROUND_COLOR, 0.92),
            borderColor: alpha(colorMap.ink950, 0.28),
            boxShadow: `0 10px 24px ${alpha(colorMap.ink950, 0.1)}`,
            color: colorMap.ink800,
          }}
        >
          <span
            className="grid h-7 w-7 place-items-center rounded-full p-1.5 transition-transform duration-200 group-hover:rotate-[-8deg]"
            style={{ backgroundColor: colorMap.coral, color: colorMap.coral100 }}
          >
            <SocialIcon name={link.icon} />
          </span>
          {link.label}
        </motion.a>
      ))}
    </nav>
  );
}
