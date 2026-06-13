"use client";

import { alpha } from "@mui/material/styles";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import LyricsPanel from "@/components/LyricsPanel";
import TransitionLink from "@/components/TransitionLink";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import { useProjectTheme } from "@/context/ProjectThemeContext";
import {
  CONTOUR_PERFORMANCE_CHANGE_EVENT,
  shouldUseStaticContourPerformanceMode,
} from "@/lib/contourPerformance";

function formatCoordinate(value, positiveLabel, negativeLabel) {
  if (!Number.isFinite(value)) {
    return "";
  }

  const label = value >= 0 ? positiveLabel : negativeLabel;
  return `${Math.abs(value).toFixed(2)}°${label}`;
}

function LiveLocationTime({ colorMap }) {
  const isReducedMotion = useReducedMotion();
  const [now, setNow] = useState(() => new Date());
  const [isStaticPerformanceMode, setIsStaticPerformanceMode] = useState(false);
  const [pointerCoordinates, setPointerCoordinates] = useState({
    latitude: 0,
    longitude: 0,
  });

  useEffect(() => {
    const updatePerformanceMode = () => {
      setIsStaticPerformanceMode(shouldUseStaticContourPerformanceMode());
    };

    updatePerformanceMode();
    const reducedDataQuery = window.matchMedia?.(
      "(prefers-reduced-data: reduce)",
    );
    reducedDataQuery?.addEventListener?.("change", updatePerformanceMode);
    window.addEventListener(CONTOUR_PERFORMANCE_CHANGE_EVENT, updatePerformanceMode);

    return () => {
      reducedDataQuery?.removeEventListener?.("change", updatePerformanceMode);
      window.removeEventListener(
        CONTOUR_PERFORMANCE_CHANGE_EVENT,
        updatePerformanceMode,
      );
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isReducedMotion || isStaticPerformanceMode) {
      return undefined;
    }

    let frameId = 0;
    let nextCoordinates = null;

    const flushCoordinates = () => {
      frameId = 0;
      if (nextCoordinates) {
        setPointerCoordinates(nextCoordinates);
        nextCoordinates = null;
      }
    };

    const updateFromPointer = (event) => {
      const width = Math.max(window.innerWidth, 1);
      const height = Math.max(window.innerHeight, 1);
      const longitude = (event.clientX / width) * 360 - 180;
      const latitude = 90 - (event.clientY / height) * 180;
      nextCoordinates = { latitude, longitude };

      if (!frameId) {
        frameId = window.requestAnimationFrame(flushCoordinates);
      }
    };

    window.addEventListener("pointermove", updateFromPointer, { passive: true });
    return () => {
      window.removeEventListener("pointermove", updateFromPointer);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isReducedMotion, isStaticPerformanceMode]);

  const timeParts = useMemo(() => {
    const time = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: true,
      minute: "2-digit",
    }).formatToParts(now);

    const hour = time.find((part) => part.type === "hour")?.value ?? "--";
    const minute = time.find((part) => part.type === "minute")?.value ?? "--";
    const dayPeriod = time.find((part) => part.type === "dayPeriod")?.value ?? "";
    const date = new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(now);

    return { date, dayPeriod, hour, minute };
  }, [now]);

  return (
    <div className="space-y-12">
      <div className="text-3xl leading-none" style={{ color: colorMap.coral }}>
        +
      </div>
      <section>
        <div
          className="inline-block border-b pb-2 text-xs uppercase tracking-[0.28em]"
          style={{
            borderColor: alpha(colorMap.coral, 0.5),
            color: colorMap.coral,
          }}
        >
          Coordinates / 坐标
        </div>
        <p
          className="mt-5 text-sm font-bold tracking-[0.06em]"
          style={{ color: colorMap.ink800 }}
        >
          Pointer on flat earth
        </p>
        <p
          className="mt-2 text-sm tracking-[0.08em]"
          style={{ color: colorMap.ink600 }}
        >
          {formatCoordinate(pointerCoordinates.latitude, "N", "S")},{" "}
          {formatCoordinate(pointerCoordinates.longitude, "E", "W")}
        </p>
      </section>
      <section>
        <div
          className="inline-block border-b pb-2 text-xs uppercase tracking-[0.28em]"
          style={{
            borderColor: alpha(colorMap.coral, 0.5),
            color: colorMap.coral,
          }}
        >
          Time / 时间
        </div>
        <p
          className="mt-5 text-3xl leading-none"
          style={{ color: colorMap.ink800 }}
        >
          {timeParts.hour}:{timeParts.minute}{" "}
          <span className="text-sm">{timeParts.dayPeriod}</span>
        </p>
        <p
          className="mt-3 text-sm tracking-[0.08em]"
          style={{ color: colorMap.ink600 }}
        >
          {timeParts.date}
        </p>
      </section>
    </div>
  );
}

export function HomeLeftRail({ className = "" }) {
  const { colorMap } = useProjectTheme();

  return (
    <aside className={`hidden min-h-0 flex-col justify-between pb-7 pt-20 min-[1500px]:flex ${className}`}>
      <LiveLocationTime colorMap={colorMap} />
      <div>
        <div
          className="mb-5 font-serif text-2xl italic"
          style={{ color: alpha(colorMap.coral, 0.45) }}
        >
          TwinZ
        </div>
        <div
          className="h-px w-44"
          style={{ backgroundColor: alpha(colorMap.coral, 0.4) }}
        />
        <p
          className="mt-5 max-w-56 text-sm uppercase leading-relaxed tracking-[0.18em]"
          style={{ color: colorMap.ink700 }}
        >
          Designing with intention. Building with curiosity.
        </p>
      </div>
    </aside>
  );
}

export function HomeRightRail({ className = "", recentPosts }) {
  const isReducedMotion = useReducedMotion();
  const {
    currentTime,
    duration,
    isLyricsOpen,
    progress,
    seekToProgress,
  } = useAudioPlayer();
  const { colorMap } = useProjectTheme();
  const resolvedRecentPosts = useMemo(
    () => (recentPosts ?? []).slice(0, 4),
    [recentPosts],
  );

  return (
    <aside className={`hidden min-h-0 flex-col justify-center min-[1500px]:flex ${className}`}>
      <div
        className="self-end text-3xl leading-none"
        style={{ color: colorMap.coral }}
      >
        +
      </div>
      <section
        className="mt-28 border-l pl-8"
        style={{ borderColor: alpha(colorMap.coral, 0.42) }}
      >
        <AnimatePresence initial={false} mode="wait">
          {isLyricsOpen ? (
            <LyricsPanel
              currentTime={currentTime}
              duration={duration}
              key="lyrics"
              onSeekToProgress={seekToProgress}
              progress={progress}
            />
          ) : (
            <motion.div
              animate={isReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              className="mt-8 space-y-5"
              exit={isReducedMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
              initial={isReducedMotion ? false : { opacity: 0, y: 22 }}
              key="articles"
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {resolvedRecentPosts.map((post) => (
                <TransitionLink
                  className="block border-b pb-5 transition hover:translate-x-1"
                  href={`/writing/${post.slug}`}
                  key={post.slug}
                  label="Opening field note"
                  style={{
                    borderColor: alpha(colorMap.coral, 0.22),
                    color: colorMap.ink800,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 grid h-4 w-4 place-items-center rounded-full border text-[9px]"
                      style={{
                        borderColor: colorMap.coral,
                        color: colorMap.coral,
                      }}
                    >
                      •
                    </span>
                    <div>
                      <h2 className="text-sm font-bold uppercase leading-snug tracking-[0.16em]">
                        {post.title}
                      </h2>
                      <p
                        className="mt-3 text-xs tracking-[0.16em]"
                        style={{ color: colorMap.ink600 }}
                      >
                        {post.date}
                      </p>
                    </div>
                  </div>
                </TransitionLink>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </aside>
  );
}
