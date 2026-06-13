"use client";

import { alpha } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useProjectTheme } from "@/context/ProjectThemeContext";
import {
  CONTOUR_PERFORMANCE_CHANGE_EVENT,
  CONTOUR_PERFORMANCE_MODE_AUTO,
  getStoredContourPerformanceMode,
  setStoredContourPerformanceMode,
} from "@/lib/contourPerformance";
import { MAIN_BACKGROUND_COLOR } from "@/lib/theme";

const FIELD_OPTIONS = Object.freeze([
  { key: "speed", label: "speed", step: "0.01" },
  { key: "sharpness", label: "sharpness", step: "0.01" },
  { key: "curvature", label: "curvature", step: "0.01" },
  { key: "thickness", label: "thickness", step: "0.01" },
]);
const PERFORMANCE_MODE_OPTIONS = Object.freeze([
  {
    key: CONTOUR_PERFORMANCE_MODE_AUTO,
    label: "AUTO",
    trigger: "系统判断",
    detail:
      "Save-Data / reduced motion / software renderer -> STATIC; Intel HD/UHD/Iris / memory <= 4 / cores <= 4 -> LOW POWER.",
  },
  {
    key: "balanced",
    label: "BALANCED",
    trigger: "手动强制",
    detail: "动态 WebGL 背景，DPR cap 1，保留完整 Perlin 等高线动效。",
  },
  {
    key: "lowPower",
    label: "LOW POWER",
    trigger: "低端核显自动",
    detail: "动态 WebGL 背景，DPR cap 0.82，Intel HD/UHD/Iris 或低内存/低核心时自动使用。",
  },
  {
    key: "static",
    label: "STATIC",
    trigger: "静态兜底",
    detail:
      "静态 SVG 等高线，不跑背景 WebGL，雷达鼠标退回系统默认。Save-Data、reduced motion 或软件渲染时自动使用。",
  },
]);

function makeDraftValues(controls) {
  return Object.fromEntries(
    FIELD_OPTIONS.map(({ key }) => [key, String(controls[key] ?? "")]),
  );
}

export default function HiddenContourSettingsDialog() {
  const {
    colorMap,
    contourControls,
    hasContourOverride,
    resetContourControls,
    setContourControls,
    themeOption,
  } = useProjectTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [draftValues, setDraftValues] = useState(() => makeDraftValues(contourControls));
  const [performanceMode, setPerformanceMode] = useState(
    CONTOUR_PERFORMANCE_MODE_AUTO,
  );
  const dialogRef = useRef(null);

  useEffect(() => {
    setDraftValues(makeDraftValues(contourControls));
  }, [contourControls]);

  useEffect(() => {
    const syncPerformanceMode = () => {
      setPerformanceMode(getStoredContourPerformanceMode());
    };

    syncPerformanceMode();
    window.addEventListener(CONTOUR_PERFORMANCE_CHANGE_EVENT, syncPerformanceMode);
    return () => {
      window.removeEventListener(
        CONTOUR_PERFORMANCE_CHANGE_EVENT,
        syncPerformanceMode,
      );
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();

      if (event.ctrlKey && event.altKey && key === "p") {
        event.preventDefault();
        setIsOpen((current) => !current);
        return;
      }

      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    requestAnimationFrame(() => {
      dialogRef.current?.querySelector("input")?.focus();
    });
  }, [isOpen]);

  const fieldRows = useMemo(
    () => FIELD_OPTIONS.map((field) => ({
      ...field,
      value: draftValues[field.key] ?? "",
    })),
    [draftValues],
  );

  const handleFieldChange = (key, value) => {
    setDraftValues((current) => ({
      ...current,
      [key]: value,
    }));

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return;
    }

    setContourControls((current) => ({
      ...current,
      [key]: numericValue,
    }));
  };

  const handleReset = () => {
    resetContourControls();
    setDraftValues(makeDraftValues(themeOption.contourControls));
  };

  const handlePerformanceModeChange = (nextMode) => {
    setPerformanceMode(nextMode);
    setStoredContourPerformanceMode(nextMode);
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          aria-hidden="false"
          className="fixed inset-0 z-[80] grid place-items-center px-4"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
          animate={{ opacity: 1 }}
          style={{ backgroundColor: alpha(colorMap.ink950, 0.24) }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            aria-label="Contour settings"
            aria-modal="true"
            className="w-full max-w-[620px] overflow-hidden rounded-[8px] border shadow-2xl"
            exit={{ opacity: 0, scale: 0.97, y: 18 }}
            initial={{ opacity: 0, scale: 0.97, y: 18 }}
            ref={dialogRef}
            role="dialog"
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{
              backgroundColor: colorMap.coral100,
              borderColor: alpha(colorMap.ink950, 0.22),
              boxShadow: `0 28px 80px ${alpha(colorMap.ink950, 0.28)}`,
              color: colorMap.ink950,
            }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
          >
            <div
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: alpha(colorMap.ink950, 0.14) }}
            >
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: themeOption.color }}>
                  {themeOption.title} / {themeOption.context}
                </div>
                <div className="mt-1 text-sm font-semibold uppercase tracking-[0.18em]">
                  CONTOUR FIELD
                </div>
              </div>
              <button
                aria-label="Close contour settings"
                className="grid h-9 w-9 place-items-center rounded-full border text-lg leading-none transition duration-200 ease-out hover:scale-105"
                onClick={() => setIsOpen(false)}
                style={{
                  backgroundColor: MAIN_BACKGROUND_COLOR,
                  borderColor: alpha(colorMap.ink950, 0.16),
                  color: colorMap.ink950,
                }}
                type="button"
              >
                x
              </button>
            </div>

            <div className="grid gap-5 px-5 py-5">
              <section
                className="grid gap-3 border p-3"
                style={{
                  backgroundColor: alpha(MAIN_BACKGROUND_COLOR, 0.62),
                  borderColor: alpha(themeOption.color, 0.22),
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: colorMap.ink700 }}>
                      RENDER PROFILE
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.16em]" style={{ color: alpha(colorMap.ink950, 0.62) }}>
                      Ctrl + Alt + P / local override
                    </div>
                  </div>
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        performanceMode === CONTOUR_PERFORMANCE_MODE_AUTO
                          ? alpha(colorMap.ink950, 0.28)
                          : themeOption.color,
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PERFORMANCE_MODE_OPTIONS.map((option, index) => {
                    const isSelected = performanceMode === option.key;

                    return (
                      <motion.button
                        aria-pressed={isSelected}
                        className="min-h-[74px] rounded-[6px] border px-3 py-3 text-left transition duration-200 ease-out hover:scale-[1.015] active:scale-[0.98]"
                        initial={{ opacity: 0, y: 8 }}
                        key={option.key}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handlePerformanceModeChange(option.key)}
                        style={{
                          backgroundColor: isSelected
                            ? alpha(themeOption.color, 0.16)
                            : alpha(colorMap.coral100, 0.34),
                          borderColor: isSelected
                            ? themeOption.color
                            : alpha(colorMap.ink950, 0.14),
                          boxShadow: isSelected
                            ? `inset 0 0 0 1px ${alpha(themeOption.color, 0.32)}`
                            : "none",
                          color: colorMap.ink950,
                        }}
                        transition={{ delay: index * 0.025, duration: 0.18, ease: "easeOut" }}
                        type="button"
                      >
                        <span className="block text-[11px] font-bold uppercase tracking-[0.18em]">
                          {option.label}
                        </span>
                        <span className="mt-2 block text-[10px] uppercase tracking-[0.12em]" style={{ color: colorMap.ink700 }}>
                          {option.trigger}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="grid gap-2">
                  {PERFORMANCE_MODE_OPTIONS.map((option) => {
                    const isSelected = performanceMode === option.key;

                    return (
                      <div
                        className="grid grid-cols-[72px_1fr] gap-3 border-t pt-2 text-[10px] leading-relaxed"
                        key={`profile-copy-${option.key}`}
                        style={{
                          borderColor: alpha(colorMap.ink950, 0.1),
                          color: isSelected ? colorMap.ink950 : colorMap.ink700,
                        }}
                      >
                        <span
                          className="font-bold uppercase tracking-[0.16em]"
                          style={{ color: isSelected ? themeOption.color : colorMap.ink700 }}
                        >
                          {option.label}
                        </span>
                        <span>{option.detail}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {fieldRows.map((field, index) => (
                <motion.label
                  className="grid grid-cols-[112px_1fr] items-center gap-3"
                  initial={{ opacity: 0, x: -8 }}
                  key={field.key}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.025, duration: 0.18, ease: "easeOut" }}
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: colorMap.ink700 }}>
                    {field.label}
                  </span>
                  <input
                    className="h-11 w-full rounded-[6px] border px-3 text-right text-sm font-semibold outline-none transition duration-200 ease-out focus:scale-[1.015]"
                    inputMode="decimal"
                    onChange={(event) => handleFieldChange(field.key, event.target.value)}
                    step={field.step}
                    style={{
                      backgroundColor: MAIN_BACKGROUND_COLOR,
                      borderColor: alpha(themeOption.color, 0.42),
                      boxShadow: `inset 0 1px 0 ${alpha(colorMap.coral100, 0.55)}`,
                      color: colorMap.ink950,
                    }}
                    type="number"
                    value={field.value}
                  />
                </motion.label>
              ))}
            </div>

            <div
              className="flex items-center justify-between border-t px-5 py-4"
              style={{ borderColor: alpha(colorMap.ink950, 0.14) }}
            >
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: hasContourOverride ? themeOption.color : alpha(colorMap.ink950, 0.24) }} />
              <button
                className="rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition duration-200 ease-out hover:scale-[1.03]"
                onClick={handleReset}
                style={{
                  backgroundColor: hasContourOverride ? themeOption.color : MAIN_BACKGROUND_COLOR,
                  borderColor: hasContourOverride ? themeOption.color : alpha(colorMap.ink950, 0.16),
                  color: hasContourOverride ? colorMap.coral100 : colorMap.ink800,
                }}
                type="button"
              >
                RESET
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
