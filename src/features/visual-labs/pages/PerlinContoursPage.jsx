"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { alpha } from "@mui/material/styles";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import LyricsPanel from "@/components/LyricsPanel";
import SocialLinks from "@/components/SocialLinks";
import TransitionLink from "@/components/TransitionLink";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import { useProjectTheme } from "@/context/ProjectThemeContext";
import WritingIndexSection from "@/features/writing/WritingIndexSection";
import { getRecentWritingPosts } from "@/features/writing/postIndex";
import { PROJECT_COLOR_MAP } from "@/lib/theme";

const CENTER_SECTION_COUNT = 3;
const ABOUT_IMAGE_URLS = [
  "/img/about-01.webp",
  "/img/about-02.webp",
  "/img/about-03.webp",
];

function HomePortraitFrame({ imageUrl, isReducedMotion }) {
  const { colorMap } = useProjectTheme();

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        animate={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
        className="relative h-[clamp(104px,14vh,172px)] w-[calc(clamp(104px,14vh,172px)*1.618)]"
        exit={isReducedMotion ? undefined : { opacity: 0, y: -18 }}
        initial={isReducedMotion ? false : { opacity: 0, y: 34 }}
        key={imageUrl}
        transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="absolute inset-3 overflow-hidden border"
          style={{
            backgroundColor: alpha(colorMap.coral100, 0.34),
            borderColor: alpha(colorMap.coral, 0.58),
          }}
        >
          <img
            alt="TwinZ portrait"
            className="h-full w-full object-cover"
            draggable="false"
            src={imageUrl}
          />
        </div>
        {[
          "left-0 top-0 border-l border-t",
          "right-0 top-0 border-r border-t",
          "bottom-0 left-0 border-b border-l",
          "bottom-0 right-0 border-b border-r",
        ].map((className) => (
          <span
            aria-hidden="true"
            className={`absolute h-8 w-8 ${className}`}
            key={className}
            style={{ borderColor: colorMap.coral }}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

export function makeDefaultControls(colorMap = PROJECT_COLOR_MAP) {
  return {
    backgroundColor: colorMap.coral100,
    lineColor: colorMap.neutral900,
    speed: 1,
    sharpness: 0.36,
    curvature: 0,
    thickness: 2,
  };
}

function formatCoordinate(value, positiveLabel, negativeLabel) {
  if (!Number.isFinite(value)) {
    return "";
  }

  const label = value >= 0 ? positiveLabel : negativeLabel;
  return `${Math.abs(value).toFixed(2)}°${label}`;
}

function LiveLocationTime({ colorMap }) {
  const [now, setNow] = useState(() => new Date());
  const [pointerCoordinates, setPointerCoordinates] = useState({
    latitude: 0,
    longitude: 0,
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateFromPointer = (event) => {
      const width = Math.max(window.innerWidth, 1);
      const height = Math.max(window.innerHeight, 1);
      const longitude = (event.clientX / width) * 360 - 180;
      const latitude = 90 - (event.clientY / height) * 180;
      setPointerCoordinates({ latitude, longitude });
    };

    window.addEventListener("pointermove", updateFromPointer, {
      passive: true,
    });
    return () => window.removeEventListener("pointermove", updateFromPointer);
  }, []);

  const timeParts = useMemo(() => {
    const time = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: true,
      minute: "2-digit",
    }).formatToParts(now);

    const hour = time.find((part) => part.type === "hour")?.value ?? "--";
    const minute = time.find((part) => part.type === "minute")?.value ?? "--";
    const dayPeriod =
      time.find((part) => part.type === "dayPeriod")?.value ?? "";
    const date = new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(now);

    return { date, dayPeriod, hour, minute };
  }, [now]);

  return (
    <div className="space-y-12">
      <div className="text-3xl leading-none" style={{ color: colorMap.coral }}>
        +
      </div>
      <section>
        <div
          className="inline-block border-b pb-2 text-xs uppercase tracking-[0.28em]"
          style={{
            borderColor: alpha(colorMap.coral, 0.5),
            color: colorMap.coral,
          }}
        >
          Coordinates / 坐标
        </div>
        <p
          className="mt-5 text-sm font-bold tracking-[0.06em]"
          style={{ color: colorMap.ink800 }}
        >
          Pointer on flat earth
        </p>
        <p
          className="mt-2 text-sm tracking-[0.08em]"
          style={{ color: colorMap.ink600 }}
        >
          {formatCoordinate(pointerCoordinates.latitude, "N", "S")},{" "}
          {formatCoordinate(pointerCoordinates.longitude, "E", "W")}
        </p>
      </section>
      <section>
        <div
          className="inline-block border-b pb-2 text-xs uppercase tracking-[0.28em]"
          style={{
            borderColor: alpha(colorMap.coral, 0.5),
            color: colorMap.coral,
          }}
        >
          Time / 时间
        </div>
        <p
          className="mt-5 text-3xl leading-none"
          style={{ color: colorMap.ink800 }}
        >
          {timeParts.hour}:{timeParts.minute}{" "}
          <span className="text-sm">{timeParts.dayPeriod}</span>
        </p>
        <p
          className="mt-3 text-sm tracking-[0.08em]"
          style={{ color: colorMap.ink600 }}
        >
          {timeParts.date}
        </p>
      </section>
    </div>
  );
}

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uMotion;
  uniform float uSpeed;
  uniform float uSharpness;
  uniform float uCurvature;
  uniform float uThickness;
  uniform vec3 uBackgroundColor;
  uniform vec3 uLineColor;

  vec2 hash2(vec2 p) {
    p = vec2(
      dot(p, vec2(127.1, 311.7)),
      dot(p, vec2(269.5, 183.3))
    );
    return fract(sin(p) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = dot(hash2(i + vec2(0.0, 0.0)) - 0.5, f - vec2(0.0, 0.0));
    float b = dot(hash2(i + vec2(1.0, 0.0)) - 0.5, f - vec2(1.0, 0.0));
    float c = dot(hash2(i + vec2(0.0, 1.0)) - 0.5, f - vec2(0.0, 1.0));
    float d = dot(hash2(i + vec2(1.0, 1.0)) - 0.5, f - vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 6; i++) {
      value += amplitude * noise(p);
      p = p * 2.0 + vec2(13.7, 7.9);
      amplitude *= 0.5;
    }

    return value * 0.5 + 0.5;
  }

  float contourBandAA(float value, float frequency, float thicknessPx, float softnessPx) {
    float scaled = value * frequency;
    float nearestBand = abs(fract(scaled) - 0.5);
    float pixelSpan = max(length(vec2(dFdx(scaled), dFdy(scaled))), 0.00014);
    float distPx = nearestBand / pixelSpan;
    return 1.0 - smoothstep(thicknessPx - softnessPx, thicknessPx + softnessPx, distPx);
  }

  void main() {
    vec2 uv = vUv;
    vec2 centered = uv - 0.5;
    centered.x *= uResolution.x / max(uResolution.y, 1.0);

    float motion = mix(0.16, 1.0, uMotion);
    float sharpness = clamp(uSharpness, 0.0, 1.0);
    float smoothness = 1.0 - sharpness;
    float curvatureControl = pow(clamp(uCurvature, 0.0, 1.0), 0.62);
    float curvature = mix(0.52, 2.22, curvatureControl);
    float lineThickness = max(uThickness, 0.1);
    float lineSoftness = mix(0.88, 0.42, sharpness);
    vec2 pointer = uPointer * vec2(0.092, 0.072);
    float t = uTime * 0.128 * motion * uSpeed;

    vec2 flowA = vec2(
      fbm(centered * 0.42 + vec2(-t * 0.62, t * 0.38) + 3.0),
      fbm(centered * 0.42 + vec2(t * 0.5, -t * 0.44) + 11.0)
    ) - 0.5;

    vec2 flowB = vec2(
      fbm(centered * 0.62 + flowA * 0.92 + vec2(t * 0.82, -t * 0.58) + 19.0),
      fbm(centered * 0.62 - flowA * 0.82 + vec2(-t * 0.64, t * 0.72) + 27.0)
    ) - 0.5;

    vec2 flowC = vec2(
      fbm(centered * 0.88 + flowB * 0.62 + vec2(-t * 0.96, t * 0.78) + 37.0),
      fbm(centered * 0.88 - flowB * 0.58 + vec2(t * 0.8, -t * 0.92) + 43.0)
    ) - 0.5;

    float turbulenceMask = smoothstep(0.34, 0.82, fbm(centered * 0.34 + vec2(t * 0.26, -t * 0.18) + 31.0));
    float eddyMask = smoothstep(0.46, 0.84, fbm(centered * 0.66 + flowA * 0.42 + vec2(-t * 0.34, t * 0.3) + 51.0));
    vec2 liquidDrift = vec2(
      sin(centered.y * 1.95 + t * 3.2 + flowA.x * 2.8 + flowC.x * 1.2),
      cos(centered.x * 1.72 - t * 2.9 + flowA.y * 3.0 - flowC.y * 1.0)
    ) * (0.008 + turbulenceMask * mix(0.01, 0.022, sharpness) + eddyMask * mix(0.006, 0.012, sharpness)) * mix(0.82, 1.14, curvature);

    vec2 eddyDrift = vec2(
      sin(centered.x * 2.8 - centered.y * 2.2 + t * 3.6 + flowB.x * 3.1),
      cos(centered.y * 2.7 + centered.x * 2.1 - t * 3.2 + flowB.y * 3.0)
    ) * eddyMask * mix(0.008, 0.014, sharpness) * mix(0.8, 1.1, curvature);

    vec2 undercurrent = vec2(
      sin(centered.y * 1.08 + t * 1.5 + flowA.x * 1.0),
      cos(centered.x * 0.96 - t * 1.38 + flowA.y * 0.92)
    ) * mix(0.012, 0.031, curvatureControl);

    vec2 warped = centered
      + flowA * mix(0.01, 0.08, curvatureControl)
      + flowB * mix(0.055, 0.3, curvatureControl)
      + flowC * mix(0.026, 0.14, curvatureControl)
      + liquidDrift
      + eddyDrift
      + undercurrent
      + pointer * 0.28;
    float macro = fbm(warped * 0.42 + vec2(-t * 0.34, t * 0.28) + 5.0);
    float detail = fbm(warped * 0.62 + vec2(t * 0.54, -t * 0.42) + 13.0);
    float micro = fbm(
      warped * mix(0.92, 1.36, sharpness)
      + flowB * mix(0.1, 0.24, sharpness)
      + liquidDrift * mix(0.52, 1.12, sharpness)
      + eddyDrift * mix(0.38, 0.84, sharpness)
      + undercurrent * mix(0.56, 0.96, sharpness)
      + vec2(-t * 0.64, t * 0.52)
      + 23.0
    );

    float sweepA = warped.x * 0.14 + warped.y * -0.05;
    float sweepB = warped.x * -0.05 + warped.y * 0.1;
    float broadArcA = sin(warped.x * 0.34 + warped.y * 0.12 + macro * 0.72 + t * 0.16) * mix(0.00035, 0.0036, curvatureControl);
    float broadArcB = cos(warped.y * 0.3 - warped.x * 0.08 + detail * 0.68 - t * 0.12) * mix(0.00025, 0.0028, curvatureControl);
    float broadArcC = sin(warped.x * 0.18 - warped.y * 0.06 + t * 0.09) * mix(0.0002, 0.0022, curvatureControl);
    float localArcA = sin(warped.x * mix(1.42, 2.36, sharpness) + warped.y * mix(0.62, 1.12, sharpness) + detail * 1.52 - t * 0.22) * mix(0.018, 0.066, curvatureControl);
    float localArcB = cos(warped.y * mix(1.3, 2.08, sharpness) - warped.x * mix(0.74, 1.18, sharpness) + macro * 1.04 + t * 0.19) * mix(0.014, 0.052, curvatureControl);
    float localArcC = sin((warped.x + warped.y) * mix(1.76, 2.82, sharpness) + micro * mix(1.08, 1.72, sharpness) - t * 0.17) * mix(0.012, 0.041, curvatureControl);
    float localArcD = cos((warped.x - warped.y) * mix(1.88, 2.96, sharpness) + detail * 1.16 + t * 0.21) * mix(0.01, 0.031, curvatureControl);
    float localArcE = sin((warped.x * 1.4 + warped.y * 1.1) * mix(1.64, 2.74, sharpness) + micro * 1.32 + t * 0.24) * mix(0.008, 0.026, curvatureControl);
    float heightField = macro * mix(0.68, 0.58, sharpness)
      + detail * mix(0.18, 0.24, sharpness)
      + micro * mix(0.012, 0.034, sharpness)
      + sweepA * mix(0.0012, 0.008, curvatureControl)
      + sweepB * mix(0.0008, 0.005, curvatureControl)
      + broadArcA
      + broadArcB
      + broadArcC
      + localArcA
      + localArcB
      + localArcC
      + localArcD
      + localArcE
      + turbulenceMask * mix(0.006, 0.014, sharpness)
      + eddyMask * mix(0.004, 0.009, sharpness)
      + smoothness * 0.01;
    heightField += pointer.x * 0.042 + pointer.y * 0.032;
    heightField = heightField * 0.5 + 0.5;

    float contourLevels = 112.0;
    float contourValue = heightField * contourLevels;
    float contourLine = contourBandAA(heightField, contourLevels, lineThickness, lineSoftness);
    float contourIndex = floor(contourValue);
    float majorMask = 1.0 - step(0.1, mod(contourIndex, 6.0));
    float midMask = 1.0 - step(0.1, mod(contourIndex + 3.0, 12.0));

    vec3 paper = uBackgroundColor;
    vec3 paperShade = mix(uBackgroundColor, uLineColor, 0.08);
    vec3 majorLine = mix(uLineColor, vec3(0.0), 0.04);
    vec3 minorLine = mix(uLineColor, uBackgroundColor, 0.24);
    vec3 midLine = mix(uLineColor, uBackgroundColor, 0.14);

    float backgroundDrift = smoothstep(0.0, 1.0, macro * 0.74 + detail * 0.2 + micro * 0.06);
    vec3 color = mix(paper, paperShade, backgroundDrift * 0.07 + eddyMask * 0.01);
    vec3 lineColor = mix(minorLine, midLine, midMask * 0.35);
    lineColor = mix(lineColor, majorLine, majorMask * 0.55);
    float lineStrength = 0.78 + majorMask * 0.06 + midMask * 0.025;
    color = mix(color, lineColor, contourLine * lineStrength);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function ContourField({ controlsRef, isReducedMotion }) {
  const materialRef = useRef(null);
  const pointerRef = useRef(new THREE.Vector2(0, 0));
  const pointerTargetRef = useRef(new THREE.Vector2(0, 0));
  const backgroundColorTargetRef = useRef(
    new THREE.Color(controlsRef.current.backgroundColor),
  );
  const lineColorTargetRef = useRef(
    new THREE.Color(controlsRef.current.lineColor),
  );
  const uniformsRef = useRef(null);
  const { size } = useThree();

  if (!uniformsRef.current) {
    uniformsRef.current = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uMotion: { value: isReducedMotion ? 0.0 : 1.0 },
      uSpeed: { value: controlsRef.current.speed },
      uSharpness: { value: controlsRef.current.sharpness },
      uCurvature: { value: controlsRef.current.curvature },
      uThickness: { value: controlsRef.current.thickness },
      uBackgroundColor: {
        value: new THREE.Color(controlsRef.current.backgroundColor),
      },
      uLineColor: { value: new THREE.Color(controlsRef.current.lineColor) },
    };
  }

  useEffect(() => {
    if (isReducedMotion) {
      pointerRef.current.set(0, 0);
      pointerTargetRef.current.set(0, 0);
      return undefined;
    }

    const handlePointerMove = (event) => {
      pointerTargetRef.current.set(
        (event.clientX / window.innerWidth - 0.5) * 2,
        (event.clientY / window.innerHeight - 0.5) * -2,
      );
    };

    const handlePointerLeave = () => {
      pointerTargetRef.current.set(0, 0);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [isReducedMotion]);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) {
      return;
    }

    material.uniforms.uResolution.value.set(size.width, size.height);
  }, [size]);

  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) {
      return;
    }

    const ease = isReducedMotion ? 0.12 : 0.065;
    pointerRef.current.lerp(pointerTargetRef.current, ease);
    material.uniforms.uTime.value += delta;
    material.uniforms.uPointer.value.copy(pointerRef.current);
    material.uniforms.uMotion.value = isReducedMotion ? 0.0 : 1.0;
    material.uniforms.uSpeed.value = THREE.MathUtils.damp(
      material.uniforms.uSpeed.value,
      controlsRef.current.speed,
      8,
      delta,
    );
    material.uniforms.uSharpness.value = THREE.MathUtils.damp(
      material.uniforms.uSharpness.value,
      controlsRef.current.sharpness,
      10,
      delta,
    );
    material.uniforms.uCurvature.value = THREE.MathUtils.damp(
      material.uniforms.uCurvature.value,
      controlsRef.current.curvature,
      8,
      delta,
    );
    material.uniforms.uThickness.value = THREE.MathUtils.damp(
      material.uniforms.uThickness.value,
      controlsRef.current.thickness,
      9,
      delta,
    );
    backgroundColorTargetRef.current.set(controlsRef.current.backgroundColor);
    lineColorTargetRef.current.set(controlsRef.current.lineColor);
    material.uniforms.uBackgroundColor.value.lerp(
      backgroundColorTargetRef.current,
      1.0 - Math.exp(-delta * 10.0),
    );
    material.uniforms.uLineColor.value.lerp(
      lineColorTargetRef.current,
      1.0 - Math.exp(-delta * 10.0),
    );
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        fragmentShader={fragmentShader}
        uniforms={uniformsRef.current}
        vertexShader={vertexShader}
      />
    </mesh>
  );
}

export const ContourCanvas = memo(function ContourCanvas({
  controlsRef,
  isReducedMotion,
}) {
  const canvasHostRef = useRef(null);
  const [eventSource, setEventSource] = useState(null);

  useEffect(() => {
    setEventSource(canvasHostRef.current);
  }, []);

  return (
    <div aria-hidden className="h-screen h-[100dvh]" ref={canvasHostRef}>
      {eventSource ? (
        <Canvas
          dpr={[1, 1.6]}
          eventPrefix="client"
          eventSource={eventSource}
          frameloop={isReducedMotion ? "demand" : "always"}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          }}
          orthographic
          camera={{ position: [0, 0, 1], zoom: 1 }}
        >
          <ContourField
            controlsRef={controlsRef}
            isReducedMotion={isReducedMotion}
          />
        </Canvas>
      ) : null}
    </div>
  );
});

export default function PerlinContoursPage() {
  const isReducedMotion = useReducedMotion();
  const {
    currentTime,
    duration,
    isLyricsOpen,
    progress,
    seekToProgress,
  } = useAudioPlayer();
  const { colorMap } = useProjectTheme();
  const centerScrollRef = useRef(null);
  const recentPosts = useMemo(() => getRecentWritingPosts(4), []);
  const age = useMemo(() => new Date().getFullYear() - 1998, []);
  const [activeCenterSection, setActiveCenterSection] = useState(0);
  const [activeAboutImage, setActiveAboutImage] = useState(0);

  useEffect(() => {
    const element = centerScrollRef.current;
    if (!element) {
      return undefined;
    }

    const updateActiveSection = () => {
      const nextSection = Math.max(
        0,
        Math.min(
          CENTER_SECTION_COUNT - 1,
          Math.round(element.scrollTop / Math.max(element.clientHeight, 1)),
        ),
      );
      setActiveCenterSection((current) =>
        current === nextSection ? current : nextSection,
      );
    };

    updateActiveSection();
    element.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      element.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  useEffect(() => {
    const element = centerScrollRef.current;
    if (!element) {
      return undefined;
    }

    const handleWheel = (event) => {
      if (element.contains(event.target)) {
        return;
      }

      event.preventDefault();
      element.scrollBy({
        top: event.deltaY,
        behavior: "smooth",
      });
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveAboutImage((current) => (current + 1) % ABOUT_IMAGE_URLS.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main
      className="relative z-10 h-screen h-[100dvh] overflow-hidden"
      style={{ color: colorMap.ink950 }}
    >
      <style>
        {`
          .perlin-center-scroll {
            scroll-behavior: smooth;
            scrollbar-width: none;
          }

          .perlin-center-panel {
            scroll-snap-stop: always;
          }

          .perlin-center-scroll::-webkit-scrollbar {
            display: none;
            height: 0;
            width: 0;
          }
        `}
      </style>

      <section className="relative h-full overflow-hidden px-5 py-6 sm:px-8 lg:px-12">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 42%, ${alpha(colorMap.coral100, 0.78)} 0%, ${alpha(colorMap.coral100, 0.34)} 45%, ${alpha(colorMap.neutral100, 0.24)} 100%)`,
          }}
        />

        <div className="relative z-20 grid h-full grid-cols-[minmax(150px,0.42fr)_minmax(520px,1.25fr)_minmax(240px,0.46fr)] grid-rows-[auto_1fr] gap-x-8 gap-y-6 max-lg:grid-cols-1">
          <header className="relative col-span-3 grid grid-cols-[1fr_auto_1fr] items-center max-lg:col-span-1">
            <div
              className="flex items-center gap-5 text-xs uppercase tracking-[0.32em]"
              style={{ color: colorMap.ink800 }}
            >
              <span className="font-bold">TwinZ</span>
              <span
                className="h-px w-8"
                style={{ backgroundColor: alpha(colorMap.coral, 0.45) }}
              />
              <span style={{ color: colorMap.coral }}>Personal Portfolio</span>
            </div>

            <nav
              className="relative grid w-[19rem] grid-cols-3 items-center text-center text-xs uppercase tracking-[0.32em]"
              style={{ color: colorMap.ink700 }}
            >
              <span
                aria-hidden="true"
                className="absolute -bottom-4 left-0 h-1.5 w-1.5 rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{
                  backgroundColor: colorMap.coral,
                  transform: `translateX(calc(${activeCenterSection} * (19rem / 3) + (19rem / 6) - 0.1875rem))`,
                }}
              />
              <span className="relative z-10">Home</span>
              <span className="relative z-10">Notes</span>
              <span className="relative z-10">About</span>
            </nav>

            <div />
          </header>

          <aside className="hidden min-h-0 flex-col justify-between pb-7 pt-20 lg:flex">
            <LiveLocationTime colorMap={colorMap} />
            <div>
              <div
                className="mb-5 font-serif text-2xl italic"
                style={{ color: alpha(colorMap.coral, 0.45) }}
              >
                TwinZ
              </div>
              <div
                className="h-px w-44"
                style={{ backgroundColor: alpha(colorMap.coral, 0.4) }}
              />
              <p
                className="mt-5 max-w-56 text-sm uppercase leading-relaxed tracking-[0.18em]"
                style={{ color: colorMap.ink700 }}
              >
                Designing with intention. Building with curiosity.
              </p>
            </div>
          </aside>

          <div
            className="perlin-center-scroll min-h-0 overflow-y-auto overscroll-contain snap-y snap-mandatory max-lg:row-start-2"
            ref={centerScrollRef}
          >
            <section className="perlin-center-panel flex h-full min-h-0 snap-start flex-col items-center justify-evenly py-[clamp(1rem,3.8vh,4.5rem)] text-center">
              <div className="flex flex-col items-center gap-[clamp(1.25rem,5.2vh,5rem)]">
                <div
                  className="text-sm uppercase tracking-[0.62em]"
                  style={{ color: colorMap.coral }}
                >
                  Design / Code / Motion
                </div>
                <h1
                  className="font-serif text-[clamp(3.2rem,min(9.2vw,15vh),11rem)] uppercase leading-[0.78] tracking-[0.035em]"
                  style={{
                    color: colorMap.ink800,
                    textShadow: `0 14px 42px ${alpha(colorMap.coral, 0.18)}`,
                  }}
                >
                  Notes On Motion
                </h1>
                <div className="space-y-[clamp(1rem,3vh,3rem)]">
                  <div
                    className="text-[clamp(1.15rem,min(2.2vw,4.2vh),2.6rem)] tracking-[0.22em]"
                    style={{ color: colorMap.coral }}
                  >
                    记录灵感，探索表达的边界。
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <span
                      className="h-px w-16"
                      style={{ backgroundColor: alpha(colorMap.coral, 0.46) }}
                    />
                    <span
                      className="h-2 w-2 rotate-45"
                      style={{ backgroundColor: colorMap.coral }}
                    />
                    <span
                      className="h-px w-16"
                      style={{ backgroundColor: alpha(colorMap.coral, 0.46) }}
                    />
                  </div>
                  <p
                    className="max-w-3xl text-base leading-loose tracking-[0.18em]"
                    style={{ color: colorMap.ink700 }}
                  >
                    I design digital experiences that move with purpose and
                    feel.
                    <br />
                    Where maps, motion, memory, and code meet, I build quiet
                    systems that speak clearly.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-[clamp(1.25rem,3.8vh,3.5rem)]">
                  {/* <HomePortraitFrame
                    imageUrl={ABOUT_IMAGE_URLS[activeAboutImage]}
                    isReducedMotion={isReducedMotion}
                  /> */}
                  <SocialLinks
                    align="center"
                    className="gap-4"
                    variant="outlineSquare"
                  />
                </div>

                <div
                  className="grid w-[min(960px,86vw)] grid-cols-[0.78fr_1.35fr_1.18fr_0.72fr] items-center border px-6 py-5 text-center backdrop-blur-[2px]"
                  style={{
                    backgroundColor: alpha(colorMap.coral100, 0.34),
                    borderColor: alpha(colorMap.coral, 0.28),
                    color: colorMap.ink800,
                  }}
                >
                  {[
                    ["田 / Tian", "姓 / Surname"],
                    ["543150640@qq.com", "邮箱 / Email"],
                    ["15886371859", "电话 / Phone"],
                    [`${age}`, "年龄 / Age"],
                  ].map(([value, label], index) => (
                    <div
                      className={index ? "border-l" : ""}
                      key={label}
                      style={{ borderColor: alpha(colorMap.coral, 0.22) }}
                    >
                      <div className="break-words px-2 text-[clamp(0.82rem,1.08vw,1.35rem)] leading-tight tracking-[0.04em]">
                        {value}
                      </div>
                      <div
                        className="mt-3 text-xs uppercase tracking-[0.2em]"
                        style={{ color: colorMap.ink700 }}
                      >
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="perlin-center-panel h-full min-h-0 snap-start py-16">
              <WritingIndexSection />
            </section>

            <section className="perlin-center-panel flex h-full min-h-0 snap-start items-center justify-center py-16">
              <div className="grid h-[min(88vh,900px)] w-full max-w-[min(94vw,1440px)] grid-cols-[clamp(3.25rem,5vw,4.75rem)_minmax(0,1fr)_clamp(3.25rem,5vw,4.75rem)] items-center gap-[clamp(0.5rem,1vw,1rem)]">
              <button
                aria-label="Previous about image"
                className="z-10 mx-auto grid h-14 w-14 place-items-center rounded-full border text-2xl shadow-[0_18px_36px_rgba(104,75,24,0.12)] transition hover:-translate-x-1"
                onClick={() => {
                  setActiveAboutImage((current) =>
                    current === 0 ? ABOUT_IMAGE_URLS.length - 1 : current - 1,
                  );
                }}
                style={{
                  backgroundColor: alpha(colorMap.coral100, 0.72),
                  borderColor: alpha(colorMap.coral, 0.32),
                  color: colorMap.coral,
                }}
                type="button"
              >
                ←
              </button>

              <div
                className="relative grid h-full min-w-0 place-items-center border p-3 shadow-[0_28px_90px_rgba(101,72,26,0.12)] backdrop-blur-[2px]"
                style={{
                  backgroundColor: alpha(colorMap.coral100, 0.3),
                  borderColor: alpha(colorMap.coral, 0.28),
                }}
              >
                <div
                  className="absolute inset-3 border"
                  style={{
                    backgroundColor: alpha(colorMap.coral100, 0.18),
                    borderColor: alpha(colorMap.coral, 0.18),
                  }}
                />
                <div
                  className="relative grid h-full w-full min-h-0 place-items-center overflow-hidden border"
                  style={{
                    backgroundColor: alpha(colorMap.coral100, 0.2),
                    borderColor: alpha(colorMap.coral, 0.16),
                  }}
                >
                  <img
                    alt={`About visual ${activeAboutImage + 1}`}
                    className="h-full w-full object-cover"
                    draggable="false"
                    src={ABOUT_IMAGE_URLS[activeAboutImage]}
                  />
                </div>
              </div>

              <button
                aria-label="Next about image"
                className="z-10 mx-auto grid h-14 w-14 place-items-center rounded-full border text-2xl shadow-[0_18px_36px_rgba(104,75,24,0.12)] transition hover:translate-x-1"
                onClick={() => {
                  setActiveAboutImage(
                    (current) => (current + 1) % ABOUT_IMAGE_URLS.length,
                  );
                }}
                style={{
                  backgroundColor: alpha(colorMap.coral100, 0.72),
                  borderColor: alpha(colorMap.coral, 0.32),
                  color: colorMap.coral,
                }}
                type="button"
              >
                →
              </button>
              </div>
            </section>
          </div>

          <aside className="hidden min-h-0 flex-col justify-center lg:flex">
            <div
              className="self-end text-3xl leading-none"
              style={{ color: colorMap.coral }}
            >
              +
            </div>
            <section
              className="mt-28 border-l pl-8"
              style={{ borderColor: alpha(colorMap.coral, 0.42) }}
            >
              <AnimatePresence initial={false} mode="wait">
                {isLyricsOpen ? (
                  <LyricsPanel
                    currentTime={currentTime}
                    duration={duration}
                    key="lyrics"
                    onSeekToProgress={seekToProgress}
                    progress={progress}
                  />
                ) : (
              <motion.div
                animate={isReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                className="mt-8 space-y-5"
                exit={isReducedMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
                initial={isReducedMotion ? false : { opacity: 0, y: 22 }}
                key="articles"
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {recentPosts.map((post) => (
                  <TransitionLink
                    className="block border-b pb-5 transition hover:translate-x-1"
                    href={`/writing/${post.slug}`}
                    key={post.slug}
                    label="Opening field note"
                    style={{
                      borderColor: alpha(colorMap.coral, 0.22),
                      color: colorMap.ink800,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1 grid h-4 w-4 place-items-center rounded-full border text-[9px]"
                        style={{
                          borderColor: colorMap.coral,
                          color: colorMap.coral,
                        }}
                      >
                        •
                      </span>
                      <div>
                        <h2 className="text-sm font-bold uppercase leading-snug tracking-[0.16em]">
                          {post.title}
                        </h2>
                        <p
                          className="mt-3 text-xs tracking-[0.16em]"
                          style={{ color: colorMap.ink600 }}
                        >
                          {post.date} / 6 min read
                        </p>
                      </div>
                    </div>
                  </TransitionLink>
                ))}
              </motion.div>
                )}
              </AnimatePresence>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
