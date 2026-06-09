"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  BASE_COLOR_LIST,
  MAIN_BACKGROUND_COLOR,
  buildProjectColorTheme,
} from "@/lib/theme";

const STORAGE_KEY = "project-theme-index";
const CONTOUR_STORAGE_KEY = "project-contour-controls";
const DEFAULT_THEME_INDEX = 4;
const CONTOUR_CONTROL_KEYS = ["speed", "sharpness", "curvature", "thickness"];

const ProjectThemeContext = createContext(null);

function normalizeThemeIndex(value) {
  const numericValue = Number(value);
  return BASE_COLOR_LIST.some((option) => option.index === numericValue)
    ? numericValue
    : DEFAULT_THEME_INDEX;
}

function normalizeContourControls(value, fallback = {}) {
  return CONTOUR_CONTROL_KEYS.reduce((controls, key) => {
    const numericValue = Number(value?.[key]);
    const fallbackValue = Number(fallback?.[key]);

    if (Number.isFinite(numericValue)) {
      controls[key] = numericValue;
    } else if (Number.isFinite(fallbackValue)) {
      controls[key] = fallbackValue;
    }

    return controls;
  }, {});
}

function readContourOverrideMap() {
  try {
    const storedValue = window.localStorage.getItem(CONTOUR_STORAGE_KEY);
    if (!storedValue) {
      return {};
    }

    const parsedValue = JSON.parse(storedValue);
    if (!parsedValue || typeof parsedValue !== "object") {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsedValue).map(([themeKey, controls]) => [
        themeKey,
        normalizeContourControls(controls),
      ]),
    );
  } catch {
    return {};
  }
}

function writeContourOverrideMap(nextMap) {
  window.localStorage.setItem(CONTOUR_STORAGE_KEY, JSON.stringify(nextMap));
}

export function ProjectThemeProvider({ children }) {
  const [themeIndex, setThemeIndexState] = useState(DEFAULT_THEME_INDEX);
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [contourOverrideMap, setContourOverrideMap] = useState({});

  useEffect(() => {
    const storedIndex = window.localStorage.getItem(STORAGE_KEY);
    if (storedIndex !== null) {
      setThemeIndexState(normalizeThemeIndex(storedIndex));
    }
    setContourOverrideMap(readContourOverrideMap());
    setIsThemeReady(true);
  }, []);

  const themeOption = useMemo(
    () => BASE_COLOR_LIST.find((option) => option.index === themeIndex) ?? BASE_COLOR_LIST[DEFAULT_THEME_INDEX],
    [themeIndex],
  );

  const projectTheme = useMemo(
    () => buildProjectColorTheme(themeOption.color),
    [themeOption.color],
  );
  const contourControls = useMemo(
    () => ({
      ...themeOption.contourControls,
      ...(contourOverrideMap[themeIndex] ?? {}),
    }),
    [contourOverrideMap, themeIndex, themeOption.contourControls],
  );
  const hasContourOverride = Boolean(contourOverrideMap[themeIndex]);

  useEffect(() => {
    document.documentElement.style.setProperty("--project-base-color", themeOption.color);
    document.documentElement.style.setProperty("--project-main-background", MAIN_BACKGROUND_COLOR);
    document.documentElement.style.setProperty("--project-theme-surface", projectTheme.map.coral100);
    document.documentElement.style.setProperty("--project-theme-ink", projectTheme.map.ink950);
  }, [projectTheme, themeOption.color]);

  const setThemeIndex = useCallback((nextIndex) => {
    const normalizedIndex = normalizeThemeIndex(nextIndex);
    setThemeIndexState(normalizedIndex);
    window.localStorage.setItem(STORAGE_KEY, String(normalizedIndex));
  }, []);

  const setContourControls = useCallback((nextControls) => {
    setContourOverrideMap((currentMap) => {
      const currentBase = BASE_COLOR_LIST.find((option) => option.index === themeIndex)?.contourControls ?? {};
      const currentControls = {
        ...currentBase,
        ...(currentMap[themeIndex] ?? {}),
      };
      const resolvedControls = typeof nextControls === "function"
        ? nextControls(currentControls)
        : nextControls;
      const normalizedControls = normalizeContourControls(resolvedControls, currentControls);
      const nextMap = {
        ...currentMap,
        [themeIndex]: normalizedControls,
      };

      writeContourOverrideMap(nextMap);
      return nextMap;
    });
  }, [themeIndex]);

  const resetContourControls = useCallback(() => {
    setContourOverrideMap((currentMap) => {
      const nextMap = { ...currentMap };
      delete nextMap[themeIndex];
      writeContourOverrideMap(nextMap);
      return nextMap;
    });
  }, [themeIndex]);

  const value = useMemo(
    () => ({
      colorMap: projectTheme.map,
      colorSequence: projectTheme.sequence,
      colors: projectTheme.colors,
      contourControls,
      hasContourOverride,
      isThemeReady,
      resetContourControls,
      setContourControls,
      setThemeIndex,
      themeIndex,
      themeOption,
    }),
    [
      contourControls,
      hasContourOverride,
      isThemeReady,
      projectTheme,
      resetContourControls,
      setContourControls,
      themeIndex,
      themeOption,
    ],
  );

  return (
    <ProjectThemeContext.Provider value={value}>
      {children}
    </ProjectThemeContext.Provider>
  );
}

export function useProjectTheme() {
  const context = useContext(ProjectThemeContext);
  if (!context) {
    throw new Error("useProjectTheme must be used inside ProjectThemeProvider");
  }

  return context;
}
