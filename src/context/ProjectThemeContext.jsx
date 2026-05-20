"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  BASE_COLOR_LIST,
  MAIN_BACKGROUND_COLOR,
  buildProjectColorTheme,
} from "@/lib/theme";

const STORAGE_KEY = "project-theme-index";
const DEFAULT_THEME_INDEX = 4;

const ProjectThemeContext = createContext(null);

function normalizeThemeIndex(value) {
  const numericValue = Number(value);
  return BASE_COLOR_LIST.some((option) => option.index === numericValue)
    ? numericValue
    : DEFAULT_THEME_INDEX;
}

export function ProjectThemeProvider({ children }) {
  const [themeIndex, setThemeIndexState] = useState(DEFAULT_THEME_INDEX);

  useEffect(() => {
    const storedIndex = window.localStorage.getItem(STORAGE_KEY);
    if (storedIndex !== null) {
      setThemeIndexState(normalizeThemeIndex(storedIndex));
    }
  }, []);

  const themeOption = useMemo(
    () => BASE_COLOR_LIST.find((option) => option.index === themeIndex) ?? BASE_COLOR_LIST[DEFAULT_THEME_INDEX],
    [themeIndex],
  );

  const projectTheme = useMemo(
    () => buildProjectColorTheme(themeOption.color),
    [themeOption.color],
  );

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

  const value = useMemo(
    () => ({
      colorMap: projectTheme.map,
      colorSequence: projectTheme.sequence,
      colors: projectTheme.colors,
      setThemeIndex,
      themeIndex,
      themeOption,
    }),
    [projectTheme, themeIndex, themeOption],
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
