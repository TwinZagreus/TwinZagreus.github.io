"use client";

import { alpha } from "@mui/material/styles";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useProjectTheme } from "@/context/ProjectThemeContext";

const TEST_LYRICS = Object.freeze([
  "Late night signal through the contour line",
  "A quiet map where the pixels breathe",
  "Motion cuts across the paper sky",
  "TwinZ drifting in a shader dream",
  "Hold the route while the background moves",
  "Every note becomes a tiny screen",
  "Scroll down slow, let the index bloom",
  "I keep the rhythm between the scenes",
]);

export default function LyricsPanel({ isOpen }) {
  const isReducedMotion = useReducedMotion();
  const { colorMap } = useProjectTheme();

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.aside
          aria-label="Lyrics panel"
          className="pointer-events-none fixed bottom-28 right-6 top-24 z-40 hidden w-[min(34vw,420px)] overflow-hidden pr-1 md:block"
          initial={isReducedMotion ? false : { opacity: 0, x: 36, scale: 0.98 }}
          animate={isReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
          exit={isReducedMotion ? { opacity: 0 } : { opacity: 0, x: 28, scale: 0.985 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="absolute inset-y-0 right-0 w-px"
            style={{ backgroundColor: alpha(colorMap.neutral700, 0.26) }}
          />
          <div
            className="mb-8 border-t pt-4 text-right text-[11px] uppercase tracking-[0.36em]"
            style={{ borderColor: alpha(colorMap.neutral700, 0.34), color: colorMap.neutral700 }}
          >
            Now playing / lyric drift
          </div>
          <motion.div
            className="space-y-7 text-right"
            animate={isReducedMotion ? undefined : { y: ["0%", "-18%", "0%"] }}
            transition={{ duration: 16, ease: "easeInOut", repeat: Infinity }}
          >
            {TEST_LYRICS.map((line, index) => (
              <motion.p
                className="text-[clamp(1.05rem,1.7vw,1.6rem)] uppercase leading-tight tracking-[0.16em]"
                initial={isReducedMotion ? false : { opacity: 0, y: 18 }}
                animate={isReducedMotion ? { opacity: 1 } : { opacity: index === 3 ? 1 : 0.58, y: 0 }}
                transition={{ delay: index * 0.045, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                key={line}
                style={{ color: index === 3 ? colorMap.ink800 : colorMap.neutral700 }}
              >
                {line}
              </motion.p>
            ))}
          </motion.div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
