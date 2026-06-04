"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { alpha } from "@mui/material/styles";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import AuthorAvatar from "@/components/AuthorAvatar";
import MouseRevealLayer from "@/components/MouseRevealLayer";
import { useProjectTheme } from "@/context/ProjectThemeContext";
import WritingIndexSection from "@/features/writing/WritingIndexSection";
import { PROJECT_COLOR_MAP } from "@/lib/theme";

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

const DEFAULT_CONTROLS = makeDefaultControls();

const TUNING_DEFAULTS = {
  speed: 1,
  sharpness: 0.36,
  curvature: 0,
  thickness: 2,
};

const DEFAULT_IMAGE_CONTROLS = {
  baseScale: 0.1,
  baseOffsetX: 0,
  baseOffsetY: 0,
  maskAlwaysVisible: false,
  maskOffsetX: 0,
  maskOffsetY: 0,
  maskScale: 0.1,
};

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
  const backgroundColorTargetRef = useRef(new THREE.Color(controlsRef.current.backgroundColor));
  const lineColorTargetRef = useRef(new THREE.Color(controlsRef.current.lineColor));
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
      uBackgroundColor: { value: new THREE.Color(controlsRef.current.backgroundColor) },
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

    window.addEventListener("pointermove", handlePointerMove);
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
    material.uniforms.uBackgroundColor.value.lerp(backgroundColorTargetRef.current, 1.0 - Math.exp(-delta * 10.0));
    material.uniforms.uLineColor.value.lerp(lineColorTargetRef.current, 1.0 - Math.exp(-delta * 10.0));
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

export const ContourCanvas = memo(function ContourCanvas({ controlsRef, isReducedMotion }) {
  const canvasHostRef = useRef(null);
  const [eventSource, setEventSource] = useState(null);

  useEffect(() => {
    setEventSource(canvasHostRef.current);
  }, []);

  return (
    <div aria-hidden className="h-screen h-[100dvh]" ref={canvasHostRef}>
      {eventSource ? (
        <Canvas
          dpr={[1.5, 2.5]}
          eventPrefix="client"
          eventSource={eventSource}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          orthographic
          camera={{ position: [0, 0, 1], zoom: 1 }}
        >
          <ContourField controlsRef={controlsRef} isReducedMotion={isReducedMotion} />
        </Canvas>
      ) : null}
    </div>
  );
});

export default function PerlinContoursPage() {
  const isReducedMotion = useReducedMotion();
  const { colorMap } = useProjectTheme();
  const pageRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: pageRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 0.42], [0, -160]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.34], [1, 0.16]);
  const themedDefaults = useMemo(() => makeDefaultControls(colorMap), [colorMap]);
  const [controls, setControls] = useState(themedDefaults);
  const [imageControls, setImageControls] = useState(DEFAULT_IMAGE_CONTROLS);
  const controlsRef = useRef(themedDefaults);
  const imageControlsRef = useRef(DEFAULT_IMAGE_CONTROLS);

  useEffect(() => {
    setControls((current) => {
      const next = {
        ...current,
        backgroundColor: themedDefaults.backgroundColor,
        lineColor: themedDefaults.lineColor,
      };
      controlsRef.current = next;
      return next;
    });
  }, [themedDefaults]);

  const updateControl = (key, value) => {
    const nextValue = Number(value);
    setControls((current) => {
      const next = { ...current, [key]: nextValue };
      controlsRef.current = next;
      return next;
    });
  };

  const resetControls = () => {
    const next = {
      ...themedDefaults,
      ...TUNING_DEFAULTS,
    };
    controlsRef.current = next;
    setControls(next);
  };

  const updateImageControl = (key, value) => {
    const nextValue = typeof value === "boolean" ? value : Number(value);
    setImageControls((current) => {
      const next = { ...current, [key]: nextValue };
      imageControlsRef.current = next;
      return next;
    });
  };

  const resetImageControls = () => {
    imageControlsRef.current = DEFAULT_IMAGE_CONTROLS;
    setImageControls(DEFAULT_IMAGE_CONTROLS);
  };

  return (
    <main
      className="relative z-10 min-h-[200vh] overflow-x-hidden"
      ref={pageRef}
      style={{ color: colorMap.ink950 }}
    >
      <section className="relative min-h-screen min-h-[100dvh] overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${alpha(colorMap.coral100, 0.28)} 0%, ${alpha(colorMap.neutral100, 0.3)} 100%)`,
          }}
        />
        <MouseRevealLayer controlsRef={imageControlsRef} />

      <motion.div
        className="pointer-events-none absolute inset-0 z-20 px-5 py-5 sm:px-7"
        style={{ opacity: heroOpacity, y: heroY }}
      >
        <div className="grid h-full grid-rows-[auto_1fr_auto] gap-8">
          <header className="flex items-start justify-between gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.36em]" style={{ color: colorMap.neutral700 }}>
                TwinZ personal journal
              </div>
              <h1
                className="mt-4 max-w-4xl font-['Trebuchet_MS','Segoe_UI',sans-serif] text-[clamp(3.2rem,9vw,7.8rem)] uppercase leading-[0.82] tracking-[0.045em]"
                style={{ color: colorMap.ink700 }}
              >
                Notes On
                <br />
                Motion
              </h1>
            </div>

            <aside className="hidden w-[min(28vw,380px)] pt-1 lg:block" style={{ color: colorMap.neutral800 }}>
              <div
                className="border-t pt-4 text-[10px] uppercase tracking-[0.32em]"
                style={{ borderColor: alpha(colorMap.neutral700, 0.45), color: colorMap.neutral700 }}
              >
                Latest Index
              </div>
              <div className="mt-6 space-y-5">
                {[
                  ["01", "Contour systems for quiet interfaces", "Three.js / Field notes"],
                  ["02", "Loading screens as a cinematic surface", "Motion / Frontend"],
                  ["03", "Theme color as identity infrastructure", "Design system"],
                ].map(([index, title, meta]) => (
                  <article
                    className="grid grid-cols-[2.5rem_1fr] gap-4 border-t pt-4"
                    key={index}
                    style={{ borderColor: alpha(colorMap.neutral700, 0.25) }}
                  >
                    <span className="text-[10px] tracking-[0.28em]" style={{ color: colorMap.neutral600 }}>
                      {index}
                    </span>
                    <div>
                      <h2 className="text-sm uppercase leading-snug tracking-[0.18em]" style={{ color: colorMap.ink700 }}>
                        {title}
                      </h2>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.22em]" style={{ color: colorMap.neutral600 }}>
                        {meta}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </aside>
          </header>

          <div className="self-center justify-self-end pr-[min(9vw,10rem)]">
            <div
              className="hidden border-l pl-5 text-[10px] uppercase leading-relaxed tracking-[0.28em] md:block"
              style={{ borderColor: alpha(colorMap.neutral700, 0.35), color: colorMap.neutral700 }}
            >
              Designing with maps,
              <br />
              motion, memory,
              <br />
              and browser light.
            </div>
          </div>

          <div className="mb-2 flex max-w-3xl items-end gap-5">
            <AuthorAvatar />
            <div className="border-l pl-5" style={{ borderColor: alpha(colorMap.neutral700, 0.35) }}>
              <div className="text-[10px] uppercase tracking-[0.32em]" style={{ color: colorMap.neutral700 }}>
                Author Signal / 2026
              </div>
              <p
                className="mt-3 max-w-xl text-[11px] uppercase leading-relaxed tracking-[0.24em]"
                style={{ color: colorMap.neutral600 }}
              >
                Personal notes on visual systems, shader sketches, motion timing, and small interface decisions.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
      </section>

      {/* <div className="pointer-events-none absolute right-4 top-28 z-30 sm:right-7 sm:top-32">
        <section
          aria-label="Contour controls"
          className="pointer-events-auto w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-[#d9d4ca] bg-[#fbfaf7]/92 p-4 text-[#5f5b52] shadow-[0_18px_48px_rgba(72,62,42,0.12)] backdrop-blur-md"
          role="dialog"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.32em] text-[#8b877d]">Live contour tuning</div>
              <div className="mt-2 text-sm text-[#6d685e]">閹锋牕濮╁鎴濇健閺冭绱濋弴鑼殠娴兼俺绻涚紒顓＄箖濞撯槄绱濇稉宥勭窗闁插秵鏌婇崝鐘烘祰閵?/div>
            </div>
            <button
              className="rounded-full border border-[#d7d2c7] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[#6a665d] transition hover:border-[#c8c1b4] hover:bg-white"
              onClick={resetControls}
              type="button"
            >
              Reset
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <label className="block">
              <div className="mb-2 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.24em] text-[#6f6a60]">
                <span>Speed / 闁喎瀹?/span>
                <span>{controls.speed.toFixed(2)}x</span>
              </div>
              <input
                className="h-2 w-full accent-[#6f7c64]"
                max="2.4"
                min="0.2"
                onInput={(event) => updateControl("speed", event.currentTarget.value)}
                step="0.01"
                type="range"
                value={controls.speed}
              />
            </label>

            <label className="block">
              <div className="mb-2 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.24em] text-[#6f6a60]">
                <span>Sharp / Smooth / 鐏忔牠鏀?/ 楠炶櫕绮?/span>
                <span>{controls.sharpness.toFixed(2)}</span>
              </div>
              <input
                className="h-2 w-full accent-[#6f7c64]"
                max="1"
                min="0"
                onInput={(event) => updateControl("sharpness", event.currentTarget.value)}
                step="0.01"
                type="range"
                value={controls.sharpness}
              />
            </label>

            <label className="block">
              <div className="mb-2 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.24em] text-[#6f6a60]">
                <span>Curvature / 瀵垱娲?/span>
                <span>{controls.curvature.toFixed(2)}</span>
              </div>
              <input
                className="h-2 w-full accent-[#6f7c64]"
                max="1"
                min="0"
                onInput={(event) => updateControl("curvature", event.currentTarget.value)}
                step="0.01"
                type="range"
                value={controls.curvature}
              />
            </label>

            <label className="block">
              <div className="mb-2 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.24em] text-[#6f6a60]">
                <span>Thickness / 閸樻艾瀹?/span>
                <span>{controls.thickness.toFixed(2)} px</span>
              </div>
              <input
                className="h-2 w-full accent-[#6f7c64]"
                max="2.4"
                min="0.35"
                onInput={(event) => updateControl("thickness", event.currentTarget.value)}
                step="0.01"
                type="range"
                value={controls.thickness}
              />
            </label>
          </div>
        </section>
      </div>

      <div className="pointer-events-none absolute right-4 top-[34rem] z-30 sm:right-7 sm:top-[36rem]">
        <section
          aria-label="Image reveal controls"
          className="pointer-events-auto w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-[#d9d4ca] bg-[#fbfaf7]/92 p-4 text-[#5f5b52] shadow-[0_18px_48px_rgba(72,62,42,0.12)] backdrop-blur-md"
          role="dialog"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.32em] text-[#8b877d]">Reveal image layout</div>
              <div className="mt-2 text-sm text-[#6d685e]">鐠嬪啯鏆?`my.png` 閸?`mask-01.png` 閻ㄥ嫮缂夐弨淇扁偓浣风秴缂冾喕浜掗崣?mask 鐢憡妯夐妴?/div>
            </div>
            <button
              className="rounded-full border border-[#d7d2c7] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[#6a665d] transition hover:border-[#c8c1b4] hover:bg-white"
              onClick={resetImageControls}
              type="button"
            >
              Reset
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-[#e3ddd2] bg-white/45 p-3">
              <div className="mb-3 text-[11px] uppercase tracking-[0.26em] text-[#7a756b]">my.png</div>

              <label className="block">
                <div className="mb-2 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.22em] text-[#6f6a60]">
                  <span>Scale / 缂傗晜鏂?/span>
                  <span>{imageControls.baseScale.toFixed(2)}</span>
                </div>
                <input
                  className="h-2 w-full accent-[#6f7c64]"
                  max="2.5"
                  min="0.1"
                  onInput={(event) => updateImageControl("baseScale", event.currentTarget.value)}
                  step="0.01"
                  type="range"
                  value={imageControls.baseScale}
                />
              </label>

              <label className="mt-3 block">
                <div className="mb-2 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.22em] text-[#6f6a60]">
                  <span>Offset X / 濡亜鎮?/span>
                  <span>{imageControls.baseOffsetX.toFixed(2)}</span>
                </div>
                <input
                  className="h-2 w-full accent-[#6f7c64]"
                  max="0.8"
                  min="-0.8"
                  onInput={(event) => updateImageControl("baseOffsetX", event.currentTarget.value)}
                  step="0.01"
                  type="range"
                  value={imageControls.baseOffsetX}
                />
              </label>

              <label className="mt-3 block">
                <div className="mb-2 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.22em] text-[#6f6a60]">
                  <span>Offset Y / 缁鹃潧鎮?/span>
                  <span>{imageControls.baseOffsetY.toFixed(2)}</span>
                </div>
                <input
                  className="h-2 w-full accent-[#6f7c64]"
                  max="0.8"
                  min="-0.8"
                  onInput={(event) => updateImageControl("baseOffsetY", event.currentTarget.value)}
                  step="0.01"
                  type="range"
                  value={imageControls.baseOffsetY}
                />
              </label>
            </div>

            <div className="rounded-xl border border-[#e3ddd2] bg-white/45 p-3">
              <div className="mb-3 text-[11px] uppercase tracking-[0.26em] text-[#7a756b]">mask-01.png</div>

              <label className="flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.22em] text-[#6f6a60]">
                <span>Always Visible / 鐢憡妯?/span>
                <input
                  checked={imageControls.maskAlwaysVisible}
                  className="h-4 w-4 accent-[#6f7c64]"
                  onChange={(event) => updateImageControl("maskAlwaysVisible", event.currentTarget.checked)}
                  type="checkbox"
                />
              </label>

              <label className="mt-3 block">
                <div className="mb-2 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.22em] text-[#6f6a60]">
                  <span>Scale / 缂傗晜鏂?/span>
                  <span>{imageControls.maskScale.toFixed(2)}</span>
                </div>
                <input
                  className="h-2 w-full accent-[#6f7c64]"
                  max="2.5"
                  min="0.4"
                  onInput={(event) => updateImageControl("maskScale", event.currentTarget.value)}
                  step="0.01"
                  type="range"
                  value={imageControls.maskScale}
                />
              </label>

              <label className="mt-3 block">
                <div className="mb-2 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.22em] text-[#6f6a60]">
                  <span>Offset X / 濡亜鎮?/span>
                  <span>{imageControls.maskOffsetX.toFixed(2)}</span>
                </div>
                <input
                  className="h-2 w-full accent-[#6f7c64]"
                  max="0.8"
                  min="-0.8"
                  onInput={(event) => updateImageControl("maskOffsetX", event.currentTarget.value)}
                  step="0.01"
                  type="range"
                  value={imageControls.maskOffsetX}
                />
              </label>

              <label className="mt-3 block">
                <div className="mb-2 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.22em] text-[#6f6a60]">
                  <span>Offset Y / 缁鹃潧鎮?/span>
                  <span>{imageControls.maskOffsetY.toFixed(2)}</span>
                </div>
                <input
                  className="h-2 w-full accent-[#6f7c64]"
                  max="0.8"
                  min="-0.8"
                  onInput={(event) => updateImageControl("maskOffsetY", event.currentTarget.value)}
                  step="0.01"
                  type="range"
                  value={imageControls.maskOffsetY}
                />
              </label>
            </div>
          </div>
        </section>
      </div> */}

      <WritingIndexSection />
    </main>
  );
}
