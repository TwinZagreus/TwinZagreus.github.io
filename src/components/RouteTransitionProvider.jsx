"use client";

import { alpha } from "@mui/material/styles";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useProjectTheme } from "@/context/ProjectThemeContext";

const RouteTransitionContext = createContext(null);

export function RouteTransitionProvider({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isReducedMotion = useReducedMotion();
  const { colorMap } = useProjectTheme();
  const [transition, setTransition] = useState(null);
  const navigateTimerRef = useRef(null);
  const clearTimerRef = useRef(null);

  useEffect(() => () => {
    window.clearTimeout(navigateTimerRef.current);
    window.clearTimeout(clearTimerRef.current);
  }, []);

  useEffect(() => {
    if (!transition) {
      return undefined;
    }

    clearTimerRef.current = window.setTimeout(() => {
      setTransition(null);
    }, isReducedMotion ? 80 : 520);

    return () => {
      window.clearTimeout(clearTimerRef.current);
    };
  }, [isReducedMotion, pathname, transition]);

  const startTransition = useCallback((href, label = "Opening field note") => {
    if (!href) {
      return;
    }

    const target = new URL(href, window.location.origin);
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const next = `${target.pathname}${target.search}${target.hash}`;

    if (current === next) {
      return;
    }

    if (isReducedMotion) {
      router.push(next);
      return;
    }

    window.clearTimeout(navigateTimerRef.current);
    window.clearTimeout(clearTimerRef.current);
    setTransition({ href: next, label });

    navigateTimerRef.current = window.setTimeout(() => {
      router.push(next);
    }, 210);
  }, [isReducedMotion, router]);

  const value = useMemo(() => ({ startTransition }), [startTransition]);

  return (
    <RouteTransitionContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {transition ? (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="absolute inset-y-0 left-0 w-[120vw]"
              initial={{ x: "-106%", skewX: -12 }}
              animate={{ x: "-8%", skewX: -12 }}
              exit={{ x: "102%", skewX: -12 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: `linear-gradient(90deg, ${alpha(colorMap.coral100, 0)} 0%, ${alpha(colorMap.coral, 0.74)} 34%, ${alpha(colorMap.ink950, 0.82)} 100%)`,
                transformOrigin: "50% 100%",
              }}
            />
            <motion.div
              className="absolute left-5 top-5 border-t pt-4 text-[10px] uppercase leading-relaxed tracking-[0.34em] sm:left-7"
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 18 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ borderColor: alpha(colorMap.coral100, 0.7), color: colorMap.coral100 }}
            >
              {transition.label}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </RouteTransitionContext.Provider>
  );
}

export function useRouteTransition() {
  const context = useContext(RouteTransitionContext);
  if (!context) {
    throw new Error("useRouteTransition must be used inside RouteTransitionProvider");
  }

  return context;
}
