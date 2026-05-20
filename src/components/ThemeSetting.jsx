"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BASE_COLOR_LIST, MAIN_BACKGROUND_COLOR } from "@/lib/theme";
import { useProjectTheme } from "@/context/ProjectThemeContext";
import PlayPauseMorphIcon from "./PlayPauseMorphIcon";

const ICON_URL = "/img/final-twin.svg";
const ICON_ACCENT_COLOR = "#F2555A";

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

export default function ThemeSetting() {
  const { setThemeIndex, themeIndex, themeOption } = useProjectTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const rootRef = useRef(null);
  const iconSrc = useTintedTwinIcon(themeOption.color);

  useEffect(() => {
    const audio = new Audio("/audio/Got%20It%203.m4a");
    audio.loop = true;
    audioRef.current = audio;

    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("ended", handleEnded);
      audioRef.current = null;
    };
  }, []);

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

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio)
      return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.warn("[ThemeSetting] Unable to play audio", error);
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3 sm:bottom-6 sm:right-6" ref={rootRef}>
      {isOpen ? (
        <div
          aria-label="Theme options"
          className="mb-0 flex flex-col gap-2"
          role="menu"
        >
          {BASE_COLOR_LIST.map((option) => {
            const isActive = option.index === themeIndex;

            return (
              <button
                aria-label={`Switch theme to ${option.context}`}
                aria-pressed={isActive}
                className="group relative grid h-12 w-12 place-items-center rounded-full border text-[12px] font-bold transition duration-200 ease-out sm:h-14 sm:w-14"
                key={option.index}
                onClick={() => setThemeIndex(option.index)}
                role="menuitem"
                title={`${option.title} / ${option.context}`}
                style={{
                  backgroundColor: MAIN_BACKGROUND_COLOR,
                  borderColor: isActive ? option.color : "rgba(25, 11, 10, 0.16)",
                  boxShadow: isActive
                    ? `0 0 0 4px ${option.color}22, 0 16px 34px rgba(25, 11, 10, 0.2)`
                    : "0 12px 26px rgba(25, 11, 10, 0.12)",
                  color: "#190B0A",
                }}
                type="button"
              >
                <span
                  className="absolute inset-[9px] rounded-full opacity-90 transition group-hover:scale-110"
                  style={{ backgroundColor: option.color }}
                />
                <span
                  className="relative grid h-6 w-6 place-items-center rounded-full text-[11px] tracking-[0.08em] text-white"
                  style={{ backgroundColor: "rgba(25, 11, 10, 0.64)" }}
                >
                  {option.title}
                </span>
                <span className="sr-only">{option.context}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <button
        aria-expanded={isOpen}
        aria-label="Toggle theme setting"
        className="grid h-12 w-12 place-items-center border-0 bg-transparent p-0 transition duration-200 ease-out hover:scale-105 sm:h-14 sm:w-14"
        onClick={() => setIsOpen((current) => !current)}
        style={{ filter: `drop-shadow(0 14px 24px ${themeOption.color}33)` }}
        type="button"
      >
        <img
          alt=""
          className="h-full w-full object-contain"
          draggable={false}
          src={iconSrc}
        />
      </button>

      <button
        aria-label={isPlaying ? "Pause audio" : "Play audio"}
        aria-pressed={isPlaying}
        className="grid h-12 w-12 place-items-center border-0 bg-transparent p-0 transition duration-200 ease-out hover:scale-105 sm:h-14 sm:w-14"
        onClick={togglePlayback}
        style={{ filter: `drop-shadow(0 14px 24px ${themeOption.color}33)` }}
        type="button"
      >
        <PlayPauseMorphIcon
          className="h-full w-full"
          color={themeOption.color}
          isPlaying={isPlaying}
          size="100%"
        />
      </button>
    </div>
  );
}
