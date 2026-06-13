"use client";

import { alpha } from "@mui/material/styles";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { useProjectTheme } from "@/context/ProjectThemeContext";
import {
  ContourCanvas,
  makeDefaultControls,
} from "@/features/visual-labs/pages/PerlinContoursPage";

const BACKDROP_ROUTES = ["/", "/home", "/perlin-contours", "/writing"];
const WHEEL_CURVATURE_TARGET = 0;
const WHEEL_CURVATURE_RESET_MS = 140;
const WHEEL_CURVATURE_IGNORE_SELECTOR = [
  "input",
  "textarea",
  "select",
  "button",
  "[contenteditable='true']",
  "[data-audio-controls='true']",
  "[role='dialog']",
  "[aria-modal='true']",
].join(",");

function shouldShowBackdrop(pathname) {
  return BACKDROP_ROUTES.some((route) => (
    route === "/" ? pathname === "/" : pathname === route || pathname.startsWith(`${route}/`)
  ));
}

function shouldIgnoreWheelCurvature(target) {
  return target instanceof Element && Boolean(target.closest(WHEEL_CURVATURE_IGNORE_SELECTOR));
}

export default function PersistentPerlinBackdrop() {
  const pathname = usePathname();
  const isReducedMotion = useReducedMotion();
  const { colorMap, contourControls } = useProjectTheme();
  const themedControls = useMemo(
    () => makeDefaultControls(colorMap, contourControls),
    [colorMap, contourControls],
  );
  const controlsSignature = `${themedControls.backgroundColor}-${themedControls.lineColor}`;
  const controlsRef = useRef(themedControls);
  const curvatureResetTimerRef = useRef(0);
  const isVisible = shouldShowBackdrop(pathname);

  useEffect(() => {
    controlsRef.current = {
      ...controlsRef.current,
      backgroundColor: themedControls.backgroundColor,
      lineColor: themedControls.lineColor,
      speed: themedControls.speed,
      curvatureOverride:
        controlsRef.current.curvatureOverride ?? themedControls.curvatureOverride,
      sharpness: themedControls.sharpness,
      curvature: themedControls.curvature,
      thickness: themedControls.thickness,
    };
  }, [themedControls]);

  useEffect(() => {
    if (!isVisible || isReducedMotion) {
      controlsRef.current.curvatureOverride = null;
      window.clearTimeout(curvatureResetTimerRef.current);
      return undefined;
    }

    const resetCurvature = () => {
      controlsRef.current.curvatureOverride = null;
    };

    const handleWheel = (event) => {
      if (shouldIgnoreWheelCurvature(event.target)) {
        return;
      }

      controlsRef.current.curvatureOverride = WHEEL_CURVATURE_TARGET;
      window.clearTimeout(curvatureResetTimerRef.current);
      curvatureResetTimerRef.current = window.setTimeout(
        resetCurvature,
        WHEEL_CURVATURE_RESET_MS,
      );
    };

    window.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.clearTimeout(curvatureResetTimerRef.current);
      controlsRef.current.curvatureOverride = null;
    };
  }, [isReducedMotion, isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ backgroundColor: themedControls.backgroundColor }}
    >
      <div
        className="absolute inset-0 z-10"
        style={{
          background: `linear-gradient(180deg, ${alpha(colorMap.coral100, 0.22)} 0%, ${alpha(colorMap.neutral100, 0.28)} 100%)`,
        }}
      />
      <ContourCanvas
        controlsRef={controlsRef}
        controlsSignature={controlsSignature}
        isReducedMotion={Boolean(isReducedMotion)}
        staticControls={themedControls}
      />
    </div>
  );
}
