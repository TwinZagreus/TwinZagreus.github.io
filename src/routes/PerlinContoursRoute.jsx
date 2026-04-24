import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";

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
    vec2 pointer = uPointer * vec2(0.092, 0.072);
    float t = uTime * 0.128 * motion;

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
    ) * (0.016 + turbulenceMask * 0.032 + eddyMask * 0.018);

    vec2 eddyDrift = vec2(
      sin(centered.x * 2.8 - centered.y * 2.2 + t * 3.6 + flowB.x * 3.1),
      cos(centered.y * 2.7 + centered.x * 2.1 - t * 3.2 + flowB.y * 3.0)
    ) * eddyMask * 0.02;

    vec2 undercurrent = vec2(
      sin(centered.y * 1.08 + t * 1.5 + flowA.x * 1.0),
      cos(centered.x * 0.96 - t * 1.38 + flowA.y * 0.92)
    ) * 0.028;

    vec2 warped = centered + flowA * 0.46 + flowB * 0.2 + flowC * 0.05 + liquidDrift + eddyDrift + undercurrent + pointer * 0.28;
    float macro = fbm(warped * 0.42 + vec2(-t * 0.34, t * 0.28) + 5.0);
    float detail = fbm(warped * 0.62 + vec2(t * 0.54, -t * 0.42) + 13.0);
    float micro = fbm(warped * 0.84 + flowB * 0.2 + liquidDrift * 1.2 + eddyDrift * 0.8 + undercurrent * 1.0 + vec2(-t * 0.64, t * 0.52) + 23.0);

    float sweepA = warped.x * 0.14 + warped.y * -0.05;
    float sweepB = warped.x * -0.05 + warped.y * 0.1;
    float broadArcA = sin(warped.x * 0.48 + warped.y * 0.16 + macro * 0.9 + t * 0.18) * 0.068;
    float broadArcB = cos(warped.y * 0.42 - warped.x * 0.1 + detail * 0.86 - t * 0.14) * 0.052;
    float broadArcC = sin(warped.x * 0.24 - warped.y * 0.08 + t * 0.11) * 0.038;
    float heightField = macro * 0.64 + detail * 0.2 + micro * 0.02 + sweepA * 0.04 + sweepB * 0.018 + broadArcA + broadArcB + broadArcC + turbulenceMask * 0.018 + eddyMask * 0.01;
    heightField += pointer.x * 0.042 + pointer.y * 0.032;
    heightField = heightField * 0.5 + 0.5;

    float contourLevels = 112.0;
    float contourValue = heightField * contourLevels;
    float contourLine = contourBandAA(heightField, contourLevels, 0.82, 0.62);
    float contourIndex = floor(contourValue);
    float majorMask = 1.0 - step(0.1, mod(contourIndex, 6.0));
    float midMask = 1.0 - step(0.1, mod(contourIndex + 3.0, 12.0));

    vec3 paper = vec3(0.972, 0.969, 0.962);
    vec3 paperShade = vec3(0.955, 0.952, 0.944);
    vec3 majorLine = vec3(0.804, 0.798, 0.772);
    vec3 minorLine = vec3(0.835, 0.829, 0.806);
    vec3 midLine = vec3(0.82, 0.814, 0.79);

    float backgroundDrift = smoothstep(0.0, 1.0, macro * 0.74 + detail * 0.2 + micro * 0.06);
    vec3 color = mix(paper, paperShade, backgroundDrift * 0.07 + eddyMask * 0.01);
    vec3 lineColor = mix(minorLine, midLine, midMask * 0.35);
    lineColor = mix(lineColor, majorLine, majorMask * 0.55);
    float lineStrength = 0.78 + majorMask * 0.06 + midMask * 0.025;
    color = mix(color, lineColor, contourLine * lineStrength);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function ContourField({ isReducedMotion }) {
  const materialRef = useRef(null);
  const pointerRef = useRef(new THREE.Vector2(0, 0));
  const pointerTargetRef = useRef(new THREE.Vector2(0, 0));
  const { size } = useThree();

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
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={{
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(size.width, size.height) },
          uPointer: { value: new THREE.Vector2(0, 0) },
          uMotion: { value: isReducedMotion ? 0.0 : 1.0 },
        }}
      />
    </mesh>
  );
}

export default function PerlinContoursRoute() {
  const isReducedMotion = useReducedMotion();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f3ee]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.28)_0%,rgba(236,233,226,0.3)_100%)]" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-5 py-5 sm:px-7">
        <div>
          <div className="text-[10px] uppercase tracking-[0.32em] text-[#7c796f]">Perlin contour study</div>
          <h1 className="mt-3 max-w-lg font-['Trebuchet_MS','Segoe_UI',sans-serif] text-[clamp(2.8rem,8vw,6.5rem)] uppercase leading-[0.88] tracking-[0.08em] text-[#4f544f]">
            Perlin
            <br />
            Topography
          </h1>
        </div>

        <div className="pointer-events-auto flex flex-wrap justify-end gap-3">
          <Link
            className="rounded-full border border-[#d7d2c7] bg-[#fbfaf7]/90 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-[#706d63] backdrop-blur-md transition duration-200 ease-out hover:bg-white hover:text-[#494d48]"
            to="/scan-effect"
          >
            Open Scan Effect
          </Link>
          <Link
            className="rounded-full border border-[#d7d2c7] bg-[#fbfaf7]/90 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-[#706d63] backdrop-blur-md transition duration-200 ease-out hover:bg-white hover:text-[#494d48]"
            to="/"
          >
            Back Home
          </Link>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-5 py-6 sm:px-7">
        <div className="max-w-2xl text-[11px] uppercase tracking-[0.28em] text-[#8b877d]">
          Randomly distributed contour islands with near-saturated drafting density, finer smoother contours, and faster undercurrents pushing through local eddies
        </div>
      </div>

      <div aria-hidden className="h-screen">
        <Canvas
          dpr={[1.5, 2.5]}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          orthographic
          camera={{ position: [0, 0, 1], zoom: 1 }}
        >
          <ContourField isReducedMotion={Boolean(isReducedMotion)} />
        </Canvas>
      </div>
    </main>
  );
}
