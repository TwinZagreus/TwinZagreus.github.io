"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const GalaxyDustSettingsContext = createContext(null);
const STORAGE_KEY = "twinz-galaxy-dust-count";
const MOTION_PAUSED_STORAGE_KEY = "twinz-galaxy-motion-paused";
const MOTION_CONFIGURATION_STORAGE_KEY = "twinz-galaxy-motion-configuration";
const MIN_DUST_COUNT = 0;
const MAX_DUST_COUNT = 300;

function clampDustCount(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return null;
  return Math.min(MAX_DUST_COUNT, Math.max(MIN_DUST_COUNT, Math.round(numericValue)));
}

function getAutomaticDustCount() {
  if (typeof window === "undefined") return 180;

  const constrainedDevice = navigator.connection?.saveData === true
    || (Number.isFinite(navigator.deviceMemory) && navigator.deviceMemory <= 4)
    || (Number.isFinite(navigator.hardwareConcurrency) && navigator.hardwareConcurrency <= 4);
  const compactViewport = window.innerWidth < 700;

  return constrainedDevice
    ? (compactViewport ? 75 : 135)
    : (compactViewport ? 95 : 180);
}

function GalaxyDustSettingsDialog() {
  const {
    dustCount,
    automaticDustCount,
    canvasFrameRate,
    motionPaused,
    isDialogOpen,
    setDustCount,
    setMotionPaused,
    resetDustCount,
    setDialogOpen,
  } = useGalaxyDustSettings();
  const closeButtonRef = useRef(null);
  const lastEnabledCountRef = useRef(180);
  const [draftCount, setDraftCount] = useState("");
  const isEnabled = dustCount !== 0;
  const sliderValue = dustCount ?? automaticDustCount;

  useEffect(() => {
    if (!isDialogOpen) return;
    setDraftCount(dustCount === null ? "" : String(dustCount));
  }, [dustCount, isDialogOpen]);

  useEffect(() => {
    if (!isDialogOpen) return;
    closeButtonRef.current?.focus();
  }, [isDialogOpen]);

  useEffect(() => {
    if (dustCount !== null && dustCount > 0) lastEnabledCountRef.current = dustCount;
  }, [dustCount]);

  const commitDraftCount = () => {
    if (draftCount.trim() === "") {
      setDraftCount(dustCount === null ? "" : String(dustCount));
      return;
    }

    const nextCount = clampDustCount(draftCount);
    if (nextCount === null) {
      setDraftCount(dustCount === null ? "" : String(dustCount));
      return;
    }
    setDustCount(nextCount);
    setDraftCount(String(nextCount));
  };

  const handleEnabledChange = (event) => {
    if (!event.target.checked) {
      if (dustCount !== null && dustCount > 0) lastEnabledCountRef.current = dustCount;
      setDustCount(0);
      return;
    }

    setDustCount(lastEnabledCountRef.current || 180);
  };

  if (!isDialogOpen) return null;

  return (
    <div className="dust-settings-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setDialogOpen(false);
    }}>
      <section className="dust-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="dust-settings-title">
        <header className="dust-settings-header">
          <div>
            <p className="dust-settings-kicker">Background control</p>
            <h2 id="dust-settings-title">Galaxy dust</h2>
          </div>
          <button ref={closeButtonRef} className="dust-settings-close" type="button" onClick={() => setDialogOpen(false)} aria-label="Close galaxy dust settings">
            <span aria-hidden="true" />
          </button>
        </header>

        <div className="dust-settings-status" aria-live="polite">
          <span>{motionPaused ? "Paused" : "Rendering"}</span>
          <strong>{dustCount === null ? `Auto / ${automaticDustCount}` : `${dustCount} particles`}</strong>
        </div>
        <div className="dust-settings-telemetry" aria-live="polite">
          <span>Canvas FPS</span>
          <strong>{canvasFrameRate} FPS</strong>
        </div>

        <label className="dust-settings-toggle">
          <span>
            <strong>Galaxy dust enabled</strong>
            <small>Controls dust particles and their bright trails.</small>
          </span>
          <input type="checkbox" checked={isEnabled} onChange={handleEnabledChange} />
          <i aria-hidden="true" />
        </label>

        <label className="dust-settings-toggle">
          <span>
            <strong>Pause galaxy motion</strong>
            <small>Freezes stars, orbits, light trails, and the core.</small>
          </span>
          <input type="checkbox" checked={motionPaused} onChange={(event) => setMotionPaused(event.target.checked)} />
          <i aria-hidden="true" />
        </label>

        <div className={`dust-settings-field ${!isEnabled ? "is-disabled" : ""}`}>
          <label htmlFor="galaxy-dust-range">Particle count</label>
          <div className="dust-settings-controls">
            <input
              id="galaxy-dust-range"
              type="range"
              min={MIN_DUST_COUNT}
              max={MAX_DUST_COUNT}
              step="5"
              value={sliderValue}
              disabled={!isEnabled}
              onChange={(event) => {
                const nextCount = clampDustCount(event.target.value);
                setDustCount(nextCount);
                setDraftCount(String(nextCount));
              }}
            />
            <input
              className="dust-settings-number"
              type="number"
              min={MIN_DUST_COUNT}
              max={MAX_DUST_COUNT}
              step="1"
              inputMode="numeric"
              value={draftCount}
              placeholder={dustCount === null ? String(automaticDustCount) : "0"}
              disabled={!isEnabled}
              aria-label="Exact galaxy dust particle count"
              onChange={(event) => setDraftCount(event.target.value)}
              onBlur={commitDraftCount}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitDraftCount();
                }
              }}
            />
          </div>
          <p>0 - 300 particles. The slider adjusts in steps of 5.</p>
        </div>

        <footer className="dust-settings-footer">
          <button className="dust-settings-auto" type="button" onClick={() => {
            resetDustCount();
            setDraftCount("");
          }}>
            Automatic
          </button>
          <span>Ctrl + Shift + G</span>
        </footer>
      </section>
    </div>
  );
}

export function GalaxyDustProvider({ children }) {
  const [dustCount, setDustCountState] = useState(null);
  const [motionPaused, setMotionPausedState] = useState(false);
  const [canvasFrameRate, setCanvasFrameRateState] = useState(0);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [automaticDustCount, setAutomaticDustCount] = useState(180);
  const [motionPreference, setMotionPreference] = useState(null);
  const [motionSettingsReady, setMotionSettingsReady] = useState(false);

  useEffect(() => {
    const storedCount = window.sessionStorage.getItem(STORAGE_KEY);
    if (storedCount !== null && /^\d+$/.test(storedCount)) {
      const nextCount = Number(storedCount);
      if (nextCount >= MIN_DUST_COUNT && nextCount <= MAX_DUST_COUNT) setDustCountState(nextCount);
    }
    try {
      const savedMotionConfiguration = JSON.parse(window.localStorage.getItem(MOTION_CONFIGURATION_STORAGE_KEY));
      if (savedMotionConfiguration
        && typeof savedMotionConfiguration.paused === "boolean"
        && (savedMotionConfiguration.source === "manual" || savedMotionConfiguration.source === "benchmark")) {
        setMotionPausedState(savedMotionConfiguration.paused);
        setMotionPreference(savedMotionConfiguration.source);
      } else if (window.sessionStorage.getItem(MOTION_PAUSED_STORAGE_KEY) === "true") {
        const legacyConfiguration = { paused: true, source: "manual" };
        window.localStorage.setItem(MOTION_CONFIGURATION_STORAGE_KEY, JSON.stringify(legacyConfiguration));
        setMotionPausedState(true);
        setMotionPreference("manual");
      }
    } catch {
      // Storage can be unavailable in private or restricted browser contexts.
      setMotionPreference("unavailable");
    }
    setMotionSettingsReady(true);

    const updateAutomaticCount = () => setAutomaticDustCount(getAutomaticDustCount());
    updateAutomaticCount();
    window.addEventListener("resize", updateAutomaticCount, { passive: true });
    return () => window.removeEventListener("resize", updateAutomaticCount);
  }, []);

  const setDustCount = useCallback((value) => {
    const nextCount = clampDustCount(value);
    if (nextCount === null) return;
    setDustCountState(nextCount);
    window.sessionStorage.setItem(STORAGE_KEY, String(nextCount));
  }, []);

  const resetDustCount = useCallback(() => {
    setDustCountState(null);
    window.sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const setMotionPaused = useCallback((isPaused) => {
    const nextPaused = Boolean(isPaused);
    setMotionPausedState(nextPaused);
    window.sessionStorage.setItem(MOTION_PAUSED_STORAGE_KEY, String(nextPaused));
    try {
      window.localStorage.setItem(MOTION_CONFIGURATION_STORAGE_KEY, JSON.stringify({ paused: nextPaused, source: "manual" }));
    } catch {
      // Keep the in-memory setting when persistent storage is unavailable.
    }
    setMotionPreference("manual");
  }, []);

  const applyPerformanceBenchmarkResult = useCallback((averageFrameRate) => {
    const nextPaused = averageFrameRate <= 60;
    setMotionPausedState(nextPaused);
    window.sessionStorage.setItem(MOTION_PAUSED_STORAGE_KEY, String(nextPaused));
    try {
      window.localStorage.setItem(MOTION_CONFIGURATION_STORAGE_KEY, JSON.stringify({ paused: nextPaused, source: "benchmark" }));
    } catch {
      // Keep the in-memory result when persistent storage is unavailable.
    }
    setMotionPreference("benchmark");
  }, []);

  const setCanvasFrameRate = useCallback((frameRate) => {
    const nextFrameRate = Math.max(0, Math.round(Number(frameRate) || 0));
    setCanvasFrameRateState((currentFrameRate) => currentFrameRate === nextFrameRate ? currentFrameRate : nextFrameRate);
  }, []);

  useEffect(() => {
    const isEditableTarget = (target) => {
      if (!(target instanceof Element)) return false;
      return target.matches("input, textarea, select, [contenteditable='true']") || target.closest("[contenteditable='true']") !== null;
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setDialogOpen(false);
        return;
      }

      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "g" && !isEditableTarget(event.target)) {
        event.preventDefault();
        setDialogOpen((isOpen) => !isOpen);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const value = useMemo(() => ({
    dustCount,
    automaticDustCount,
    canvasFrameRate,
    motionPaused,
    motionPreference,
    motionSettingsReady,
    isDialogOpen,
    setDustCount,
    setCanvasFrameRate,
    setMotionPaused,
    applyPerformanceBenchmarkResult,
    resetDustCount,
    setDialogOpen,
  }), [applyPerformanceBenchmarkResult, automaticDustCount, canvasFrameRate, dustCount, isDialogOpen, motionPaused, motionPreference, motionSettingsReady, resetDustCount, setCanvasFrameRate, setDustCount, setMotionPaused]);

  return (
    <GalaxyDustSettingsContext.Provider value={value}>
      {children}
      <GalaxyDustSettingsDialog />
    </GalaxyDustSettingsContext.Provider>
  );
}

export function useGalaxyDustSettings() {
  const settings = useContext(GalaxyDustSettingsContext);
  if (!settings) throw new Error("useGalaxyDustSettings must be used inside GalaxyDustProvider");
  return settings;
}
