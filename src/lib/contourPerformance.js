export const CONTOUR_PERFORMANCE_STORAGE_KEY = "project-contour-performance";
export const CONTOUR_PERFORMANCE_CHANGE_EVENT = "project-contour-performance-change";
export const CONTOUR_PERFORMANCE_MODE_AUTO = "auto";
export const CONTOUR_PERFORMANCE_MODE_OPTIONS = Object.freeze([
  CONTOUR_PERFORMANCE_MODE_AUTO,
  "balanced",
  "lowPower",
  "static",
]);

export function getStoredContourPerformanceMode() {
  if (typeof window === "undefined") {
    return CONTOUR_PERFORMANCE_MODE_AUTO;
  }

  try {
    const storedProfile = window.localStorage.getItem(
      CONTOUR_PERFORMANCE_STORAGE_KEY,
    );

    if (storedProfile === "balanced" || storedProfile === "static") {
      return storedProfile;
    }

    if (
      storedProfile === "low" ||
      storedProfile === "low-power" ||
      storedProfile === "lowPower"
    ) {
      return "lowPower";
    }
  } catch {
    return CONTOUR_PERFORMANCE_MODE_AUTO;
  }

  return CONTOUR_PERFORMANCE_MODE_AUTO;
}

export function setStoredContourPerformanceMode(nextMode) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (nextMode === CONTOUR_PERFORMANCE_MODE_AUTO) {
      window.localStorage.removeItem(CONTOUR_PERFORMANCE_STORAGE_KEY);
    } else if (CONTOUR_PERFORMANCE_MODE_OPTIONS.includes(nextMode)) {
      window.localStorage.setItem(CONTOUR_PERFORMANCE_STORAGE_KEY, nextMode);
    } else {
      return;
    }
  } catch {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(CONTOUR_PERFORMANCE_CHANGE_EVENT, {
      detail: { mode: getStoredContourPerformanceMode() },
    }),
  );
}

export function shouldUseStaticContourPerformanceMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const connection = window.navigator.connection;
  const prefersReducedData =
    connection?.saveData ||
    window.matchMedia?.("(prefers-reduced-data: reduce)")?.matches;

  return getStoredContourPerformanceMode() === "static" || Boolean(prefersReducedData);
}
