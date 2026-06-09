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

function shouldShowBackdrop(pathname) {
  return BACKDROP_ROUTES.some((route) => (
    route === "/" ? pathname === "/" : pathname === route || pathname.startsWith(`${route}/`)
  ));
}

export default function PersistentPerlinBackdrop() {
  const pathname = usePathname();
  const isReducedMotion = useReducedMotion();
  const { colorMap, contourControls } = useProjectTheme();
  const themedControls = useMemo(
    () => makeDefaultControls(colorMap, contourControls),
    [colorMap, contourControls],
  );
  const controlsRef = useRef(themedControls);
  const isVisible = shouldShowBackdrop(pathname);

  useEffect(() => {
    controlsRef.current = {
      ...controlsRef.current,
      backgroundColor: themedControls.backgroundColor,
      lineColor: themedControls.lineColor,
      speed: themedControls.speed,
      sharpness: themedControls.sharpness,
      curvature: themedControls.curvature,
      thickness: themedControls.thickness,
    };
  }, [themedControls]);

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
      <ContourCanvas controlsRef={controlsRef} isReducedMotion={Boolean(isReducedMotion)} />
    </div>
  );
}
