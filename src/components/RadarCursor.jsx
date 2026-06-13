"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useProjectTheme } from "@/context/ProjectThemeContext";
import {
  CONTOUR_PERFORMANCE_CHANGE_EVENT,
  shouldUseStaticContourPerformanceMode,
} from "@/lib/contourPerformance";

const SCAN_DURATION_MS = 680;
const BLIP_DURATION_MS = 1100;
const FOLLOW_EASE = 0.28;
const IDLE_SWEEP_DURATION_MS = 2800;
const RADAR_RADIUS = 34;
const BLIP_INTERVAL_MS = 360;

function supportsFinePointer() {
  return window.matchMedia?.("(pointer: fine)").matches ?? false;
}

function isSoftwareRendererName(rendererName = "") {
  return /microsoft basic|swiftshader|llvmpipe/i.test(rendererName);
}

function getCursorGpuRendererName() {
  if (typeof document === "undefined") {
    return "";
  }

  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2", { powerPreference: "low-power" }) ||
      canvas.getContext("webgl", { powerPreference: "low-power" }) ||
      canvas.getContext("experimental-webgl", { powerPreference: "low-power" });

    if (!context) {
      return "software renderer unavailable";
    }

    const debugInfo = context.getExtension("WEBGL_debug_renderer_info");
    const rendererName = debugInfo
      ? context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : context.getParameter(context.RENDERER);

    context.getExtension("WEBGL_lose_context")?.loseContext();
    return String(rendererName ?? "");
  } catch {
    return "";
  }
}

export default function RadarCursor() {
  const { colorMap } = useProjectTheme();
  const isReducedMotion = useReducedMotion();
  const cursorRef = useRef(null);
  const frameRef = useRef(null);
  const isVisibleRef = useRef(false);
  const lastBlipAtRef = useRef(0);
  const sweepAngleRef = useRef(0);
  const positionRef = useRef({ currentX: 0, currentY: 0, targetX: 0, targetY: 0 });
  const startTimeRef = useRef(0);
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasSoftwareRenderer, setHasSoftwareRenderer] = useState(false);
  const [shouldUseDefaultCursor, setShouldUseDefaultCursor] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [blips, setBlips] = useState([]);
  const [scans, setScans] = useState([]);

  useEffect(() => {
    const updatePerformanceCursorMode = () => {
      setShouldUseDefaultCursor(shouldUseStaticContourPerformanceMode());
    };

    updatePerformanceCursorMode();
    const reducedDataQuery = window.matchMedia?.(
      "(prefers-reduced-data: reduce)",
    );
    reducedDataQuery?.addEventListener?.("change", updatePerformanceCursorMode);
    window.addEventListener(
      CONTOUR_PERFORMANCE_CHANGE_EVENT,
      updatePerformanceCursorMode,
    );

    return () => {
      reducedDataQuery?.removeEventListener?.(
        "change",
        updatePerformanceCursorMode,
      );
      window.removeEventListener(
        CONTOUR_PERFORMANCE_CHANGE_EVENT,
        updatePerformanceCursorMode,
      );
    };
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setHasSoftwareRenderer(
        isSoftwareRendererName(getCursorGpuRendererName()),
      );
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    const updateEnabled = () => {
      setIsEnabled(
        supportsFinePointer() &&
          !isReducedMotion &&
          !shouldUseDefaultCursor &&
          !hasSoftwareRenderer,
      );
    };

    updateEnabled();
    const mediaQuery = window.matchMedia?.("(pointer: fine)");
    mediaQuery?.addEventListener?.("change", updateEnabled);

    return () => {
      mediaQuery?.removeEventListener?.("change", updateEnabled);
    };
  }, [hasSoftwareRenderer, isReducedMotion, shouldUseDefaultCursor]);

  useEffect(() => {
    if (!isEnabled) {
      document.documentElement.classList.remove("radar-cursor-enabled");
      isVisibleRef.current = false;
      setBlips([]);
      setScans([]);
      setIsVisible(false);
      return undefined;
    }

    startTimeRef.current = performance.now();
    lastBlipAtRef.current = startTimeRef.current;

    const addBlip = () => {
      const angle = sweepAngleRef.current - Math.random() * 0.42;
      const radius = RADAR_RADIUS * (0.28 + Math.random() * 0.62);
      const id = `${performance.now()}-${Math.random()}`;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      setBlips((current) => [
        ...current.slice(-5),
        {
          id,
          size: 3 + Math.random() * 3,
          x,
          y,
        },
      ]);

      window.setTimeout(() => {
        setBlips((current) => current.filter((blip) => blip.id !== id));
      }, BLIP_DURATION_MS);
    };

    const animate = (now) => {
      const position = positionRef.current;
      position.currentX += (position.targetX - position.currentX) * FOLLOW_EASE;
      position.currentY += (position.targetY - position.currentY) * FOLLOW_EASE;
      sweepAngleRef.current =
        (((now - startTimeRef.current) % IDLE_SWEEP_DURATION_MS) /
          IDLE_SWEEP_DURATION_MS) *
        Math.PI *
        2;

      if (
        isVisibleRef.current &&
        now - lastBlipAtRef.current > BLIP_INTERVAL_MS + Math.random() * 180
      ) {
        lastBlipAtRef.current = now;
        addBlip();
      }

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${position.currentX}px, ${position.currentY}px, 0) translate(-50%, -50%)`;
      }

      frameRef.current = window.requestAnimationFrame(animate);
    };

    const handlePointerMove = (event) => {
      positionRef.current.targetX = event.clientX;
      positionRef.current.targetY = event.clientY;

      if (!isVisibleRef.current) {
        positionRef.current.currentX = event.clientX;
        positionRef.current.currentY = event.clientY;
        isVisibleRef.current = true;
        document.documentElement.classList.add("radar-cursor-enabled");
        setIsVisible(true);
      }
    };

    const handlePointerLeave = () => {
      isVisibleRef.current = false;
      document.documentElement.classList.remove("radar-cursor-enabled");
      setBlips([]);
      setIsVisible(false);
    };

    const handlePointerDown = (event) => {
      const id = `${event.timeStamp}-${event.clientX}-${event.clientY}`;
      setScans((current) => [
        ...current.slice(-3),
        { id, x: event.clientX, y: event.clientY },
      ]);

      window.setTimeout(() => {
        setScans((current) => current.filter((scan) => scan.id !== id));
      }, SCAN_DURATION_MS);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", handlePointerLeave);
    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      document.documentElement.classList.remove("radar-cursor-enabled");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isEnabled]);

  if (!isEnabled) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="radar-cursor-layer"
      style={{
        "--radar-color": colorMap.coral,
        "--radar-soft": colorMap.coral100,
      }}
    >
      <div
        className="radar-cursor"
        data-visible={isVisible ? "true" : "false"}
        ref={cursorRef}
      >
        <span className="radar-cursor__ring" />
        <span className="radar-cursor__cross radar-cursor__cross--x" />
        <span className="radar-cursor__cross radar-cursor__cross--y" />
        <span className="radar-cursor__sweep">
          <span className="radar-cursor__sweep-tail" />
          <span className="radar-cursor__sweep-line" />
        </span>
        {blips.map((blip) => (
          <span
            className="radar-cursor__blip"
            key={blip.id}
            style={{
              transform: `translate3d(${blip.x}px, ${blip.y}px, 0) translate(-50%, -50%)`,
            }}
          >
            <span
              className="radar-cursor__blip-core"
              style={{
                height: blip.size,
                width: blip.size,
              }}
            />
          </span>
        ))}
        <span className="radar-cursor__core" />
      </div>

      {scans.map((scan) => (
        <span
          className="radar-cursor-scan"
          key={scan.id}
          style={{
            left: scan.x,
            top: scan.y,
          }}
        />
      ))}
    </div>
  );
}
