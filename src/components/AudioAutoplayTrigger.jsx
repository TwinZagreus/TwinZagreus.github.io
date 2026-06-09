"use client";

import { useEffect, useRef } from "react";
import { useAudioPlayer } from "@/context/AudioPlayerContext";

const AUTOPLAY_SKIP_SELECTOR = "[data-audio-controls='true']";
const AUTOPLAY_RETRY_DELAY_MS = 1000;
const AUTOPLAY_RETRY_LIMIT = 20;
const AUTOPLAY_LOG_PREFIX = "[AudioAutoplay]";

function isInsideAudioControls(target) {
  return target instanceof Element && Boolean(target.closest(AUTOPLAY_SKIP_SELECTOR));
}

export default function AudioAutoplayTrigger() {
  const { hasUserPaused, isPlaying, playPlayback, setIsLyricsOpen } = useAudioPlayer();
  const hasCompletedRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(0);

  useEffect(() => {
    if (hasCompletedRef.current || hasUserPaused || isPlaying) {
      console.info(`${AUTOPLAY_LOG_PREFIX} stopped before start`, {
        hasCompleted: hasCompletedRef.current,
        hasUserPaused,
        isPlaying,
      });
      hasCompletedRef.current = true;
      window.clearTimeout(retryTimerRef.current);
      return undefined;
    }

    let isMounted = true;
    retryCountRef.current = 0;
    console.info(`${AUTOPLAY_LOG_PREFIX} mounted after loading gate`);

    const cleanupFns = [];
    const removeFallbackListeners = () => {
      while (cleanupFns.length) {
        cleanupFns.pop()?.();
      }
    };

    const stopAutoplay = () => {
      console.info(`${AUTOPLAY_LOG_PREFIX} completed; removing retry and fallback listeners`);
      hasCompletedRef.current = true;
      window.clearTimeout(retryTimerRef.current);
      removeFallbackListeners();
    };

    const tryPlay = async (reason) => {
      console.info(`${AUTOPLAY_LOG_PREFIX} play attempt`, {
        reason,
        retryCount: retryCountRef.current,
      });
      const didPlay = await playPlayback();
      if (!isMounted) {
        return didPlay;
      }

      if (didPlay) {
        setIsLyricsOpen(true);
        stopAutoplay();
      }

      return didPlay;
    };

    const handleInteraction = (event) => {
      if (isInsideAudioControls(event.target)) {
        console.info(`${AUTOPLAY_LOG_PREFIX} interaction ignored inside audio controls`, {
          type: event.type,
        });
        return;
      }

      console.info(`${AUTOPLAY_LOG_PREFIX} captured user interaction fallback`, {
        type: event.type,
      });
      void tryPlay(`interaction:${event.type}`);
    };

    const installFallbackListeners = () => {
      console.info(`${AUTOPLAY_LOG_PREFIX} installing capture fallback listeners`);
      const pointerOptions = { capture: true, passive: true };
      window.addEventListener("pointerdown", handleInteraction, pointerOptions);
      window.addEventListener("keydown", handleInteraction, true);
      window.addEventListener("touchstart", handleInteraction, pointerOptions);
      cleanupFns.push(() => window.removeEventListener("pointerdown", handleInteraction, true));
      cleanupFns.push(() => window.removeEventListener("keydown", handleInteraction, true));
      cleanupFns.push(() => window.removeEventListener("touchstart", handleInteraction, true));
    };

    const scheduleRetry = () => {
      if (retryCountRef.current >= AUTOPLAY_RETRY_LIMIT) {
        console.info(`${AUTOPLAY_LOG_PREFIX} retry limit reached`, {
          limit: AUTOPLAY_RETRY_LIMIT,
        });
        return;
      }

      retryCountRef.current += 1;
      console.info(`${AUTOPLAY_LOG_PREFIX} scheduling retry`, {
        delayMs: AUTOPLAY_RETRY_DELAY_MS,
        retryCount: retryCountRef.current,
      });
      retryTimerRef.current = window.setTimeout(() => {
        if (!isMounted || hasCompletedRef.current) {
          console.info(`${AUTOPLAY_LOG_PREFIX} retry skipped`, {
            hasCompleted: hasCompletedRef.current,
            isMounted,
            retryCount: retryCountRef.current,
          });
          return;
        }

        void tryPlay("retry").then((didPlay) => {
          if (!didPlay && isMounted && !hasCompletedRef.current) {
            scheduleRetry();
          }
        });
      }, AUTOPLAY_RETRY_DELAY_MS);
    };

    void tryPlay("initial").then((didPlay) => {
      if (!isMounted || didPlay || hasCompletedRef.current) {
        console.info(`${AUTOPLAY_LOG_PREFIX} initial attempt finished`, {
          didPlay,
          hasCompleted: hasCompletedRef.current,
          isMounted,
        });
        return;
      }

      installFallbackListeners();
      scheduleRetry();
    });

    return () => {
      console.info(`${AUTOPLAY_LOG_PREFIX} unmounted; cleaning up`);
      isMounted = false;
      window.clearTimeout(retryTimerRef.current);
      removeFallbackListeners();
    };
  }, [hasUserPaused, isPlaying, playPlayback, setIsLyricsOpen]);

  return null;
}
