"use client";

import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useRef, useState } from "react";
import { BASE_COLOR_LIST, MAIN_BACKGROUND_COLOR } from "@/lib/theme";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import { useProjectTheme } from "@/context/ProjectThemeContext";
import CircularKnob from "./CircularKnob";
import PlayPauseMorphIcon from "./PlayPauseMorphIcon";

const ICON_URL = "/img/final-single-circle.svg";
const ICON_ACCENT_COLOR = BASE_COLOR_LIST[3].color;

function makeSvgDataUrl(svgText) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
}

function useTintedTwinIcon(accentColor) {
  const [svgText, setSvgText] = useState("");

  useEffect(() => {
    let isMounted = true;

    fetch(ICON_URL)
      .then((response) => response.text())
      .then((text) => {
        if (isMounted) {
          setSvgText(text);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSvgText("");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return useMemo(() => {
    if (!svgText) {
      return ICON_URL;
    }

    const tintedSvg = svgText.replaceAll(ICON_ACCENT_COLOR, accentColor);

    return makeSvgDataUrl(tintedSvg);
  }, [accentColor, svgText]);
}

function LyricsToggleIcon({ color, isOpen }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      {isOpen ? (
        <>
          <path
            d="M6 7.5H18M6 12H14M6 16.5H10"
            stroke={color}
            strokeLinecap="round"
            strokeWidth="1.7"
          />
          <path
            d="M15.5 14.5L19 18M19 14.5L15.5 18"
            stroke={color}
            strokeLinecap="round"
            strokeWidth="1.7"
          />
        </>
      ) : (
        <>
          <path
            d="M7 7.5H17M7 12H14.5M7 16.5H11.5"
            stroke={color}
            strokeLinecap="round"
            strokeWidth="1.7"
          />
          <path
            d="M16.2 13.8C17.9 13.8 19.2 15 19.2 16.5C19.2 18 17.9 19.2 16.2 19.2C15.5 19.2 14.9 19 14.4 18.7L12.8 19.1L13.3 17.8C13.1 17.4 13 17 13 16.5C13 15 14.4 13.8 16.2 13.8Z"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </>
      )}
    </svg>
  );
}

function ChevronIcon({ color, isOpen }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 transition-transform duration-200"
      fill="none"
      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
      viewBox="0 0 24 24"
    >
      <path
        d="M9 6L15 12L9 18"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function ThemeSetting() {
  const {
    beginSilentSeek,
    endSilentSeek,
    isLyricsOpen,
    isPlaying,
    progress,
    seekToProgress,
    setIsLyricsOpen,
    setVolume,
    togglePlayback,
    volume,
  } = useAudioPlayer();
  const { colorMap, setThemeIndex, themeIndex, themeOption } = useProjectTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const rotationFrameRef = useRef(0);
  const rotationPreviousTimeRef = useRef(0);
  const rotationValueRef = useRef(0);
  const settingIconRef = useRef(null);
  const rootRef = useRef(null);
  const iconSrc = useTintedTwinIcon(themeOption.color);
  const controlButtonStyle = {
    backgroundColor: colorMap.coral100,
    borderColor: alpha(colorMap.ink950, 0.24),
    boxShadow: `0 10px 24px ${alpha(colorMap.ink950, 0.1)}`,
    color: themeOption.color,
  };

  useEffect(() => {
    if (!isPlaying) {
      window.cancelAnimationFrame(rotationFrameRef.current);
      rotationPreviousTimeRef.current = 0;
      return undefined;
    }

    const rotate = (time) => {
      if (rotationPreviousTimeRef.current) {
        const deltaSeconds = (time - rotationPreviousTimeRef.current) / 1000;
        rotationValueRef.current = (rotationValueRef.current + deltaSeconds * 20) % 360;
        if (settingIconRef.current) {
          settingIconRef.current.style.transform = `rotate(${rotationValueRef.current}deg)`;
        }
      }

      rotationPreviousTimeRef.current = time;
      rotationFrameRef.current = window.requestAnimationFrame(rotate);
    };

    rotationFrameRef.current = window.requestAnimationFrame(rotate);
    return () => {
      window.cancelAnimationFrame(rotationFrameRef.current);
      rotationPreviousTimeRef.current = 0;
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!isOpen)
      return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <>
      <div
        className="fixed bottom-4 right-4 z-50 flex items-end gap-2 sm:bottom-[50px] sm:right-[50px] sm:gap-3 max-lg:items-center"
        data-audio-controls="true"
        ref={rootRef}
      >
        {/* Main controls container */}
        <div
          className={`flex items-center gap-2 rounded-full border p-1.5 backdrop-blur-[6px] sm:gap-1 sm:p-1 ${isCollapsed ? "invisible pointer-events-none" : ""}`}
          style={{
            backgroundColor: alpha(colorMap.ink950, 0.16),
            borderColor: alpha(colorMap.ink950, 0.42),
            boxShadow: `0 18px 42px ${alpha(colorMap.ink950, 0.24)}`,
          }}
        >
          {/* Theme options popup */}
          <div
            aria-hidden={!isOpen}
            aria-label="Theme options"
            className="absolute bottom-1.5 right-full mr-1 h-[228px] w-11 overflow-visible sm:bottom-1 sm:mr-1.5 sm:h-[256px] sm:w-12"
            role="menu"
          >
            {BASE_COLOR_LIST.map((option, itemIndex) => {
              const isActive = option.index === themeIndex;

              return (
                <button
                  aria-label={`Switch theme to ${option.context}`}
                  aria-pressed={isActive}
                  className="theme-option-pop group absolute right-0 grid h-11 w-11 place-items-center rounded-full border text-[11px] font-bold sm:h-12 sm:w-12"
                  data-open={isOpen ? "true" : "false"}
                  key={option.index}
                  onClick={() => setThemeIndex(option.index)}
                  role="menuitem"
                  tabIndex={isOpen ? 0 : -1}
                  title={`${option.title} / ${option.context}`}
                  style={{
                    "--target-y-desktop": `${itemIndex * 52}px`,
                    "--target-y-mobile": `${itemIndex * 46}px`,
                    backgroundColor: MAIN_BACKGROUND_COLOR,
                    borderColor: isActive ? option.color : alpha(colorMap.ink950, 0.16),
                    boxShadow: isActive
                      ? `0 0 0 4px ${alpha(option.color, 0.14)}, 0 16px 34px ${alpha(colorMap.ink950, 0.2)}`
                      : `0 12px 26px ${alpha(colorMap.ink950, 0.12)}`,
                    color: colorMap.ink950,
                    animationDelay: isOpen ? `${itemIndex * 30}ms` : "0ms",
                    transitionDelay: isOpen
                      ? `${itemIndex * 28}ms`
                      : `${(BASE_COLOR_LIST.length - 1 - itemIndex) * 16}ms`,
                  }}
                  type="button"
                >
                  <span
                    className="absolute inset-[9px] rounded-full opacity-90 transition group-hover:scale-110"
                    style={{ backgroundColor: option.color }}
                  />
                  <span
                    className="relative grid h-6 w-6 place-items-center rounded-full text-[11px] tracking-[0.08em]"
                    style={{
                      backgroundColor: alpha(colorMap.ink950, 0.64),
                      color: colorMap.coral100,
                    }}
                  >
                    {option.title}
                  </span>
                  <span className="sr-only">{option.context}</span>
                </button>
              );
            })}
          </div>

          {/* Setting button */}
          <button
            aria-expanded={isOpen}
            aria-label="Toggle theme setting"
            className="relative grid h-11 w-11 place-items-center rounded-full border p-0 transition duration-200 ease-out hover:scale-105 sm:h-12 sm:w-12"
            onClick={() => setIsOpen((current) => !current)}
            style={controlButtonStyle}
            type="button"
          >
            <CircularKnob
              color={themeOption.color}
              hitAreaColor={colorMap.coral100}
              label="Song progress"
              onChange={(nextProgress) => seekToProgress(nextProgress, { silent: false })}
              onInteractionEnd={endSilentSeek}
              onInteractionStart={beginSilentSeek}
              thumbColor={colorMap.coral100}
              trackColor={alpha(colorMap.ink950, 0.28)}
              value={progress}
            />
            <img
              alt=""
              className="pointer-events-none h-full w-full object-contain"
              draggable={false}
              ref={settingIconRef}
              src={iconSrc}
            />
          </button>

          {/* Play/Pause button */}
          <button
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
            aria-pressed={isPlaying}
            className="relative grid h-11 w-11 place-items-center rounded-full border p-0 transition duration-200 ease-out hover:scale-105 sm:h-12 sm:w-12"
            onClick={togglePlayback}
            style={controlButtonStyle}
            type="button"
          >
            <CircularKnob
              color={themeOption.color}
              hitAreaColor={colorMap.coral100}
              label="Audio volume"
              onChange={setVolume}
              thumbColor={colorMap.coral100}
              trackColor={alpha(colorMap.ink950, 0.28)}
              value={volume}
            />
            <PlayPauseMorphIcon
              className="pointer-events-none h-full w-full"
              color={themeOption.color}
              isPlaying={isPlaying}
              size="100%"
            />
          </button>

          {/* Lyrics button - desktop only */}
          <button
            aria-expanded={isLyricsOpen}
            aria-label={isLyricsOpen ? "Collapse lyrics" : "Expand lyrics"}
            className="grid h-9 w-9 place-items-center rounded-full border transition duration-200 ease-out hover:scale-105 max-lg:hidden sm:h-12 sm:w-12"
            onClick={() => setIsLyricsOpen((current) => !current)}
            style={{
              ...controlButtonStyle,
              borderColor: isLyricsOpen ? themeOption.color : controlButtonStyle.borderColor,
              boxShadow: isLyricsOpen
                ? `0 10px 24px ${alpha(colorMap.coral, 0.18)}`
                : controlButtonStyle.boxShadow,
            }}
            title={isLyricsOpen ? "Collapse lyrics" : "Expand lyrics"}
            type="button"
          >
            <LyricsToggleIcon color={themeOption.color} isOpen={isLyricsOpen} />
          </button>
        </div>

        {/* Collapse/Expand toggle button - mobile only */}
        <button
          aria-label={isCollapsed ? "Show controls" : "Hide controls"}
          className="grid h-11 w-11 place-items-center rounded-full border transition duration-200 ease-out hover:scale-105 lg:hidden"
          onClick={() => setIsCollapsed((current) => !current)}
          style={controlButtonStyle}
          type="button"
        >
          <ChevronIcon color={themeOption.color} isOpen={!isCollapsed} />
        </button>
      </div>
    </>
  );
}
