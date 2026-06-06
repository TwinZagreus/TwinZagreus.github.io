"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BASE_COLOR_LIST, MAIN_BACKGROUND_COLOR } from "@/lib/theme";
import { useProjectTheme } from "@/context/ProjectThemeContext";
import CircularKnob from "./CircularKnob";
import LyricsPanel from "./LyricsPanel";
import PlayPauseMorphIcon from "./PlayPauseMorphIcon";

const ICON_URL = "/img/final-single-circle.svg";
const ICON_ACCENT_COLOR = "#F2555A";
const VOLUME_CURVE_EXPONENT = 3.32;

function knobValueToAudioVolume(value) {
  return Math.max(0, Math.min(1, value)) ** VOLUME_CURVE_EXPONENT;
}

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
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef(null);
  const rotationFrameRef = useRef(0);
  const rotationPreviousTimeRef = useRef(0);
  const rotationValueRef = useRef(0);
  const settingIconRef = useRef(null);
  const rootRef = useRef(null);
  const iconSrc = useTintedTwinIcon(themeOption.color);

  useEffect(() => {
    const audio = new Audio("/audio/Got%20It%203.m4a");
    audio.loop = true;
    audio.volume = knobValueToAudioVolume(volume);
    audioRef.current = audio;

    const updateProgress = () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        setProgress(0);
        return;
      }
      setProgress(audio.currentTime / audio.duration);
    };
    const handleEnded = () => setProgress(0);
    const handleLoadedMetadata = updateProgress;
    const handleTimeUpdate = updateProgress;

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio.pause();
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = knobValueToAudioVolume(volume);
    }
  }, [volume]);

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

  const updateSongProgress = (nextProgress) => {
    const audio = audioRef.current;
    setProgress(nextProgress);
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0)
      return;
    audio.currentTime = audio.duration * nextProgress;
  };

  const updateVolume = (nextVolume) => {
    setVolume(nextVolume);
    if (audioRef.current) {
      audioRef.current.volume = knobValueToAudioVolume(nextVolume);
    }
  };

  return (
    <>
      <LyricsPanel isOpen={isLyricsOpen} />
      <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3 sm:bottom-6 sm:right-6" ref={rootRef}>
        <div
          aria-hidden={!isOpen}
          aria-label="Theme options"
          className="relative h-[272px] w-12 sm:h-[312px] sm:w-14"
          role="menu"
        >
          {BASE_COLOR_LIST.map((option, itemIndex) => {
            const isActive = option.index === themeIndex;

            return (
              <button
                aria-label={`Switch theme to ${option.context}`}
                aria-pressed={isActive}
                className="theme-option-pop group absolute right-0 grid h-12 w-12 place-items-center rounded-full border text-[12px] font-bold sm:h-14 sm:w-14"
                data-open={isOpen ? "true" : "false"}
                key={option.index}
                onClick={() => setThemeIndex(option.index)}
                role="menuitem"
                tabIndex={isOpen ? 0 : -1}
                title={`${option.title} / ${option.context}`}
                style={{
                  "--target-y-desktop": `${itemIndex * 64}px`,
                  "--target-y-mobile": `${itemIndex * 56}px`,
                  backgroundColor: MAIN_BACKGROUND_COLOR,
                  borderColor: isActive ? option.color : "rgba(25, 11, 10, 0.16)",
                  boxShadow: isActive
                    ? `0 0 0 4px ${option.color}22, 0 16px 34px rgba(25, 11, 10, 0.2)`
                    : "0 12px 26px rgba(25, 11, 10, 0.12)",
                  color: "#190B0A",
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

        <button
          aria-expanded={isLyricsOpen}
          aria-label={isLyricsOpen ? "Collapse lyrics" : "Expand lyrics"}
          className="grid h-12 w-12 place-items-center rounded-full border text-[11px] uppercase tracking-[0.18em] transition duration-200 ease-out hover:scale-105 sm:h-14 sm:w-14"
          onClick={() => setIsLyricsOpen((current) => !current)}
          style={{
            backgroundColor: MAIN_BACKGROUND_COLOR,
            borderColor: isLyricsOpen ? themeOption.color : "rgba(25, 11, 10, 0.16)",
            boxShadow: `0 14px 28px ${themeOption.color}24`,
            color: themeOption.color,
          }}
          title={isLyricsOpen ? "收起歌词" : "展开歌词"}
          type="button"
        >
          {isLyricsOpen ? "收" : "词"}
        </button>

        <button
          aria-expanded={isOpen}
          aria-label="Toggle theme setting"
          className="relative grid h-12 w-12 place-items-center border-0 bg-transparent p-0 transition duration-200 ease-out hover:scale-105 sm:h-14 sm:w-14"
          onClick={() => setIsOpen((current) => !current)}
          style={{ filter: `drop-shadow(0 14px 24px ${themeOption.color}33)` }}
          type="button"
        >
          <CircularKnob
            color={themeOption.color}
            label="Song progress"
            onChange={updateSongProgress}
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

        <button
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
          aria-pressed={isPlaying}
          className="relative grid h-12 w-12 place-items-center border-0 bg-transparent p-0 transition duration-200 ease-out hover:scale-105 sm:h-14 sm:w-14"
          onClick={togglePlayback}
          style={{ filter: `drop-shadow(0 14px 24px ${themeOption.color}33)` }}
          type="button"
        >
          <CircularKnob
            color={themeOption.color}
            label="Audio volume"
            onChange={updateVolume}
            value={volume}
          />
          <PlayPauseMorphIcon
            className="pointer-events-none h-full w-full"
            color={themeOption.color}
            isPlaying={isPlaying}
            size="100%"
          />
        </button>
      </div>
    </>
  );
}
