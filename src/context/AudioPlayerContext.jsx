"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const AUDIO_URL = "/audio/Got%20It%203.opus";
const AUDIO_LOG_PREFIX = "[AudioPlayer]";
const VOLUME_CURVE_EXPONENT = 3.32;

const AudioPlayerContext = createContext(null);

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function knobValueToAudioVolume(value) {
  return clamp01(value) ** VOLUME_CURVE_EXPONENT;
}

export function AudioPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const progressRef = useRef(0);
  const durationRef = useRef(0);
  const mutedBeforeSeekRef = useRef(false);
  const restoreMuteTimerRef = useRef(0);
  const frameRef = useRef(0);
  const isSilentSeekingRef = useRef(false);
  const volumeRef = useRef(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasUserPaused, setHasUserPaused] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgressState] = useState(0);
  const [volume, setVolumeState] = useState(0.5);

  const syncProgressFromAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
      progressRef.current = 0;
      setCurrentTime(0);
      setProgressState(0);
      return;
    }

    const nextProgress = clamp01(audio.currentTime / audio.duration);
    progressRef.current = nextProgress;
    setCurrentTime((current) => (
      Math.abs(current - audio.currentTime) > 0.05 ? audio.currentTime : current
    ));
    setProgressState((current) => (
      Math.abs(current - nextProgress) > 0.001 ? nextProgress : current
    ));
  }, []);

  useEffect(() => {
    const audio = new Audio(AUDIO_URL);
    audio.loop = true;
    audio.volume = knobValueToAudioVolume(volumeRef.current ?? 0.5);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      const nextDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
      durationRef.current = nextDuration;
      setDuration(nextDuration);
      syncProgressFromAudio();
    };
    const handleTimeUpdate = syncProgressFromAudio;
    const handleEnded = () => {
      setIsPlaying(false);
      syncProgressFromAudio();
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      window.clearTimeout(restoreMuteTimerRef.current);
      window.cancelAnimationFrame(frameRef.current);
      audio.pause();
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audioRef.current = null;
    };
  }, [syncProgressFromAudio]);

  useEffect(() => {
    volumeRef.current = volume;
    if (audioRef.current) {
      audioRef.current.volume = knobValueToAudioVolume(volume);
    }
  }, [volume]);

  useEffect(() => {
    if (!isPlaying) {
      window.cancelAnimationFrame(frameRef.current);
      return undefined;
    }

    let previousTick = 0;
    const tick = (now) => {
      if (now - previousTick > 90) {
        previousTick = now;
        syncProgressFromAudio();
      }
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameRef.current);
  }, [isPlaying, syncProgressFromAudio]);

  const beginSilentSeek = useCallback(() => {
    const audio = audioRef.current;
    if (!audio)
      return;

    window.clearTimeout(restoreMuteTimerRef.current);
    if (!isSilentSeekingRef.current) {
      mutedBeforeSeekRef.current = audio.muted;
    }
    isSilentSeekingRef.current = true;
    audio.muted = true;
  }, []);

  const endSilentSeek = useCallback(() => {
    const audio = audioRef.current;
    if (!audio)
      return;

    window.clearTimeout(restoreMuteTimerRef.current);
    restoreMuteTimerRef.current = window.setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.muted = mutedBeforeSeekRef.current;
      }
      isSilentSeekingRef.current = false;
    }, 120);
  }, []);

  const seekToProgress = useCallback((nextProgress, { silent = true } = {}) => {
    const audio = audioRef.current;
    const normalizedProgress = clamp01(nextProgress);
    progressRef.current = normalizedProgress;
    setProgressState(normalizedProgress);

    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0)
      return;

    if (silent) {
      beginSilentSeek();
    }
    audio.currentTime = audio.duration * normalizedProgress;
    setCurrentTime(audio.currentTime);
    syncProgressFromAudio();
    if (silent) {
      endSilentSeek();
    }
  }, [beginSilentSeek, endSilentSeek, syncProgressFromAudio]);

  const seekBySeconds = useCallback((deltaSeconds, options) => {
    const audio = audioRef.current;
    const knownDuration = audio?.duration || durationRef.current;
    if (!Number.isFinite(knownDuration) || knownDuration <= 0)
      return;

    const currentTime = audio ? audio.currentTime : progressRef.current * knownDuration;
    seekToProgress((currentTime + deltaSeconds) / knownDuration, options);
  }, [seekToProgress]);

  const setVolume = useCallback((nextVolume) => {
    setVolumeState(clamp01(nextVolume));
  }, []);

  const playPlayback = useCallback(async ({ userInitiated = false } = {}) => {
    const audio = audioRef.current;
    if (!audio) {
      console.info(`${AUDIO_LOG_PREFIX} play skipped: audio element is not ready`);
      return false;
    }

    if (userInitiated) {
      console.info(`${AUDIO_LOG_PREFIX} user initiated playback request`);
      setHasUserPaused(false);
    }

    if (!audio.paused) {
      console.info(`${AUDIO_LOG_PREFIX} play skipped: already playing`);
      setIsPlaying(true);
      return true;
    }

    try {
      console.info(`${AUDIO_LOG_PREFIX} calling audio.play()`, {
        muted: audio.muted,
        readyState: audio.readyState,
        userInitiated,
        volume: audio.volume,
      });
      await audio.play();
      console.info(`${AUDIO_LOG_PREFIX} audio.play() succeeded`);
      setIsPlaying(true);
      return true;
    } catch (error) {
      console.warn(`${AUDIO_LOG_PREFIX} audio.play() failed`, {
        message: error?.message,
        name: error?.name,
        readyState: audio.readyState,
        userInitiated,
      });
      setIsPlaying(false);
      return false;
    }
  }, []);

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio)
      return;

    if (!audio.paused) {
      audio.pause();
      setHasUserPaused(true);
      setIsPlaying(false);
      return;
    }

    const didPlay = await playPlayback({ userInitiated: true });
    if (!didPlay) {
      const error = new Error("Browser blocked audio playback");
      console.warn("[AudioPlayer] Unable to play audio", error);
    }
  }, [playPlayback]);

  const value = useMemo(
    () => ({
      beginSilentSeek,
      currentTime,
      duration,
      hasUserPaused,
      endSilentSeek,
      isLyricsOpen,
      isPlaying,
      playPlayback,
      progress,
      seekBySeconds,
      seekToProgress,
      setIsLyricsOpen,
      setVolume,
      togglePlayback,
      volume,
    }),
    [
      beginSilentSeek,
      currentTime,
      duration,
      hasUserPaused,
      endSilentSeek,
      isLyricsOpen,
      isPlaying,
      playPlayback,
      progress,
      seekBySeconds,
      seekToProgress,
      setVolume,
      togglePlayback,
      volume,
    ],
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used inside AudioPlayerProvider");
  }

  return context;
}
