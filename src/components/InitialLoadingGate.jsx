"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ThreeLoadingOverlay, { LOADING_OVERLAY_CONFIG } from "./ThreeLoadingOverlay";
import { useProjectTheme } from "@/context/ProjectThemeContext";

const STATIC_SHELL_ID = "initial-loading-shell";
const MINIMUM_VISIBLE_MS = 850;
const READY_FALLBACK_MS = 2200;

function waitForWindowLoad() {
  if (document.readyState === "complete") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.addEventListener("load", resolve, { once: true });
  });
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      window.setTimeout(resolve, timeoutMs);
    }),
  ]);
}

export default function InitialLoadingGate({ children, deferredControls = null }) {
  const { colorMap, isThemeReady } = useProjectTheme();
  const [isOverlayMounted, setIsOverlayMounted] = useState(false);
  const [isReadyToExit, setIsReadyToExit] = useState(false);
  const [isInitialLoadingComplete, setIsInitialLoadingComplete] = useState(false);

  const loadingConfig = useMemo(
    () => {
      const viewportHeight = typeof window === "undefined" ? 1200 : window.innerHeight;

      return {
        ...LOADING_OVERLAY_CONFIG,
        animatedLetterColor: colorMap.coral,
        backgroundColor: colorMap.coral100,
        logoColor: colorMap.ink950,
        sliceFallDistance: Math.round(Math.max(viewportHeight * 1.8, 1600)),
      };
    },
    [colorMap],
  );

  const handleOverlayMounted = useCallback(() => {
    document.getElementById(STATIC_SHELL_ID)?.remove();
    setIsOverlayMounted(true);
  }, []);

  const handleOverlayExited = useCallback(() => {
    setIsInitialLoadingComplete(true);
  }, []);

  useEffect(() => {
    if (!isOverlayMounted)
      return undefined;

    let cancelled = false;
    const minimumVisible = new Promise((resolve) => {
      window.setTimeout(resolve, MINIMUM_VISIBLE_MS);
    });
    const fontsReady = document.fonts?.ready ?? Promise.resolve();

    Promise.all([
      minimumVisible,
      withTimeout(waitForWindowLoad(), READY_FALLBACK_MS),
      withTimeout(fontsReady, READY_FALLBACK_MS),
    ]).then(() => {
      if (!cancelled) {
        setIsReadyToExit(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isOverlayMounted]);

  if (!isThemeReady) {
    return null;
  }

  return (
    <>
      {isOverlayMounted ? children : null}
      {isInitialLoadingComplete ? deferredControls : null}
      {!isInitialLoadingComplete ? (
        <ThreeLoadingOverlay
          config={loadingConfig}
          isReady={isReadyToExit}
          onExited={handleOverlayExited}
          onMounted={handleOverlayMounted}
        />
      ) : null}
    </>
  );
}
