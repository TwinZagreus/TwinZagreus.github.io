"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useProjectTheme } from "@/context/ProjectThemeContext";

const LRC_URL = "/audio/subtitles.lrc";
const LYRIC_ROW_GAP = 76;
const TIMESTAMP_PATTERN = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

function parseTimestamp(minutes, seconds, fraction = "0") {
  const normalizedFraction = fraction.padEnd(3, "0").slice(0, 3);
  return Number(minutes) * 60 + Number(seconds) + Number(normalizedFraction) / 1000;
}

function parseLrc(lrcText) {
  return lrcText
    .split(/\r?\n/)
    .flatMap((line) => {
      const matches = [...line.matchAll(TIMESTAMP_PATTERN)];
      const text = line.replace(TIMESTAMP_PATTERN, "").trim();
      if (!matches.length || !text) {
        return [];
      }

      return matches.map((match) => ({
        text,
        time: parseTimestamp(match[1], match[2], match[3]),
      }));
    })
    .sort((left, right) => left.time - right.time);
}

function findActiveLyricIndex(lyrics, currentTime) {
  if (!lyrics.length) {
    return -1;
  }

  let activeIndex = 0;
  for (let index = 0; index < lyrics.length; index += 1) {
    if (lyrics[index].time > currentTime) {
      break;
    }
    activeIndex = index;
  }
  return activeIndex;
}

export default function LyricsPanel({
  currentTime,
  duration,
  onSeekToProgress,
  progress,
}) {
  const isReducedMotion = useReducedMotion();
  const { colorMap } = useProjectTheme();
  const dragBaseIndexRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const dragStartYRef = useRef(0);
  const [dragBaseIndex, setDragBaseIndex] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lrcText, setLrcText] = useState("");

  useEffect(() => {
    let isMounted = true;

    fetch(LRC_URL)
      .then((response) => response.text())
      .then((text) => {
        if (isMounted) {
          setLrcText(text);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLrcText("");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const lyrics = useMemo(() => parseLrc(lrcText), [lrcText]);
  const fallbackDuration = lyrics.at(-1)?.time ?? 0;
  const displayTime = currentTime ?? progress * (duration || fallbackDuration || 1);
  const activeIndex = findActiveLyricIndex(lyrics, displayTime);
  const safeActiveIndex = Math.max(0, activeIndex);
  const baseIndex = isDragging && dragBaseIndex !== null ? dragBaseIndex : safeActiveIndex;
  const clampLyricIndex = (index) =>
    Math.max(0, Math.min(lyrics.length - 1, index));

  const getDraggedLyricIndex = (offset) =>
    lyrics.length
      ? clampLyricIndex(baseIndex - Math.round(offset / LYRIC_ROW_GAP))
      : -1;

  const selectedIndex = getDraggedLyricIndex(dragOffset);

  const clampDragOffset = (nextOffset) => {
    if (!lyrics.length) {
      return 0;
    }

    const minOffset = (baseIndex - (lyrics.length - 1)) * LYRIC_ROW_GAP;
    const maxOffset = baseIndex * LYRIC_ROW_GAP;

    return Math.max(minOffset, Math.min(maxOffset, nextOffset));
  };

  const handlePointerDown = (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartYRef.current = event.clientY;
    dragStartOffsetRef.current = 0;
    dragBaseIndexRef.current = safeActiveIndex;
    dragOffsetRef.current = 0;
    isDraggingRef.current = true;
    setDragBaseIndex(safeActiveIndex);
    setDragOffset(0);
    setIsDragging(true);
  };

  const handlePointerMove = (event) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const nextOffset = clampDragOffset(dragStartOffsetRef.current + event.clientY - dragStartYRef.current);
    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  };

  const finishDrag = (event, shouldSeek = true) => {
    if (!isDraggingRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    isDraggingRef.current = false;
    setIsDragging(false);
    setDragBaseIndex(null);
    setDragOffset(0);

    const knownDuration = duration || fallbackDuration;
    const targetIndex = lyrics.length
      ? Math.max(
          0,
          Math.min(
            lyrics.length - 1,
            dragBaseIndexRef.current - Math.round(dragOffsetRef.current / LYRIC_ROW_GAP),
          ),
        )
      : -1;
    dragOffsetRef.current = 0;

    if (
      !shouldSeek ||
      targetIndex < 0 ||
      !Number.isFinite(knownDuration) ||
      knownDuration <= 0
    ) {
      return;
    }

    const targetProgress = Math.max(
      0,
      Math.min(1, lyrics[targetIndex].time / knownDuration),
    );
    onSeekToProgress?.(targetProgress, { silent: true });
  };

  return (
    <motion.div
      aria-label="Lyrics panel"
      className="relative mt-8 h-[min(42vh,420px)] min-h-[300px] overflow-hidden pr-2"
      data-lyrics-panel="true"
      initial={isReducedMotion ? false : { opacity: 0, y: 22 }}
      animate={isReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      data-dragging-lyrics={isDragging ? "true" : "false"}
      exit={isReducedMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
      onPointerCancel={(event) => finishDrag(event, false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onWheel={(event) => event.stopPropagation()}
      style={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none" }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0">
        {lyrics.map((lyric, index) => {
          const isActive = index === activeIndex;
          const isSelected = isDragging && index === selectedIndex;
          const isPrimary = isDragging ? isSelected : isActive;
          const distance = activeIndex < 0 ? 0 : Math.abs(index - activeIndex);
          const relativeIndex = index - baseIndex;
          const dragDistance = selectedIndex < 0 ? distance : Math.abs(index - selectedIndex);
          const isVisible = isDragging ? dragDistance <= 4 : distance <= 4;

          return (
            <motion.div
              animate={{
                opacity: isVisible ? (isPrimary ? 1 : Math.max(0.24, 0.64 - dragDistance * 0.11)) : 0,
                x: isPrimary ? 0 : 4,
                y: relativeIndex * LYRIC_ROW_GAP + dragOffset,
              }}
              className="absolute left-0 right-2 top-1/2 will-change-transform"
              key={`${lyric.time}-${lyric.text}`}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{ pointerEvents: "none" }}
            >
              <p
                className="m-0 text-left text-[clamp(1.1rem,1.55vw,1.56rem)] uppercase leading-tight tracking-[0.16em]"
                data-active-lyric={isPrimary ? "true" : "false"}
                style={{
                  color: isPrimary ? colorMap.ink800 : colorMap.neutral700,
                  transform: "translateY(-50%)",
                }}
              >
                {lyric.text}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
