import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
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

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.02;
      amplitude *= 0.52;
    }

    return value;
  }

  float burstBand(float position, float center, float width, float softness) {
    float d = abs(position - center);
    return exp(-pow(d / width, softness));
  }

  void main() {
    vec2 uv = vUv;
    vec2 centered = uv - 0.5;
    centered.x *= uResolution.x / max(uResolution.y, 1.0);

    float time = uTime * (0.22 + uMotion * 0.78);
    vec2 pointer = uPointer * 0.08;

    float radial = length(centered + pointer * 0.35);
    float field = fbm(centered * vec2(1.8, 3.4) + vec2(time * 0.28, -time * 0.15));
    float drift = fbm(centered * vec2(4.8, 1.6) + vec2(-time * 0.95, time * 0.24));
    float haze = fbm(centered * 2.2 + vec2(time * 0.12, time * 0.08));
    float micro = fbm(centered * vec2(8.0, 5.5) + vec2(-time * 0.42, time * 0.36));

    vec3 deep = vec3(0.02, 0.05, 0.045);
    vec3 carbon = vec3(0.05, 0.09, 0.082);
    vec3 moss = vec3(0.13, 0.24, 0.205);
    vec3 lime = vec3(0.80, 1.00, 0.42);
    vec3 ember = vec3(0.90, 0.44, 0.24);
    vec3 mist = vec3(0.86, 0.92, 0.88);

    vec3 color = mix(deep, carbon, smoothstep(-0.35, 0.65, uv.y));
    color += moss * smoothstep(0.55, 0.02, radial) * 0.42;
    color += vec3(0.02, 0.04, 0.03) * field * 0.45;

    float diagonal = centered.x * 1.35 + centered.y * 0.38 + drift * 0.18 + (micro - 0.5) * 0.08;
    float sweepA = 0.5 + 0.5 * sin(time * 1.12 + 0.3);
    float sweepB = 0.5 + 0.5 * sin(time * 1.44 + 1.2);
    float sweepC = 0.5 + 0.5 * sin(time * 1.18 + 2.4);
    float sweepD = 0.5 + 0.5 * sin(time * 1.62 + 3.3);

    float bandA = burstBand(diagonal, mix(-1.55, 1.55, sweepA), 0.045, 1.85);
    float bandB = burstBand(diagonal, mix(1.45, -1.65, sweepB), 0.032, 1.9);
    float bandC = burstBand(diagonal, mix(-1.9, 1.4, sweepC), 0.06, 2.1);
    float bandD = burstBand(diagonal, mix(1.7, -1.4, sweepD), 0.04, 2.0);

    float pulse = 0.55 + 0.45 * sin(uTime * 2.2);
    float burst = bandA * 1.15 + bandB * 0.95 + bandC * 0.72 + bandD * (0.62 + pulse * 0.12);
    float glow = smoothstep(0.1, 1.35, burst) * (0.55 + field * 0.35);
    float feather = 0.65 + micro * 0.55;

    color += lime * bandA * (0.38 + drift * 0.18) * feather;
    color += mist * bandB * 0.22 * feather;
    color += ember * bandC * (0.28 + haze * 0.16) * feather;
    color += lime * bandD * 0.16 * feather;
    color += mix(lime, ember, 0.4) * glow * 0.32;

    float atmosphere = smoothstep(1.18, 0.12, radial);
    float shimmer = smoothstep(0.56, 0.98, sin(diagonal * 56.0 - time * 6.8 + micro * 2.2) * 0.5 + 0.5);
    color += vec3(0.055, 0.08, 0.07) * atmosphere * 0.26;
    color += mix(lime, mist, 0.35) * shimmer * burst * 0.035;

    float vignette = smoothstep(1.18, 0.18, radial);
    color *= vignette;
    color += vec3(haze * 0.02);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function BackgroundPlane({ isReducedMotion, pointerRef }) {
  const materialRef = useRef(null);
  const pointerLerpRef = useRef({ x: 0, y: 0 });
  const { size } = useThree();

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

    const target = pointerRef.current;
    pointerLerpRef.current.x = THREE.MathUtils.lerp(pointerLerpRef.current.x, target.x, 0.04);
    pointerLerpRef.current.y = THREE.MathUtils.lerp(pointerLerpRef.current.y, target.y, 0.04);

    material.uniforms.uTime.value += delta;
    material.uniforms.uPointer.value.set(pointerLerpRef.current.x, pointerLerpRef.current.y);
    material.uniforms.uMotion.value = isReducedMotion ? 0.18 : 1.0;
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
          uMotion: { value: isReducedMotion ? 0.18 : 1.0 },
        }}
      />
    </mesh>
  );
}

export default function HomepageBackground() {
  const isReducedMotion = useReducedMotion();
  const pointerRef = useRef({ x: 0, y: 0 });
  const canvasHostRef = useRef(null);
  const [eventSource, setEventSource] = useState(null);

  useEffect(() => {
    setEventSource(canvasHostRef.current);
  }, []);

  useEffect(() => {
    if (isReducedMotion) {
      pointerRef.current = { x: 0, y: 0 };
      return undefined;
    }

    const handlePointerMove = (event) => {
      pointerRef.current = {
        x: (event.clientX / window.innerWidth - 0.5) * 2.0,
        y: (event.clientY / window.innerHeight - 0.5) * -2.0,
      };
    };

    const handlePointerLeave = () => {
      pointerRef.current = { x: 0, y: 0 };
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [isReducedMotion]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" ref={canvasHostRef}>
      {eventSource ? (
        <Canvas
          dpr={[1, 1.5]}
          eventPrefix="client"
          eventSource={eventSource}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          orthographic
          camera={{ position: [0, 0, 1], zoom: 1 }}
        >
          <BackgroundPlane isReducedMotion={isReducedMotion} pointerRef={pointerRef} />
        </Canvas>
      ) : null}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(93,126,110,0.18),_transparent_34%),radial-gradient(circle_at_72%_62%,_rgba(200,255,106,0.08),_transparent_24%),radial-gradient(circle_at_86%_36%,_rgba(255,146,79,0.09),_transparent_22%)] mix-blend-screen" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,7,6,0.06)_0%,rgba(4,7,6,0.18)_54%,rgba(4,7,6,0.36)_100%)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(rgba(255,255,255,0.75)_0.6px,transparent_0.6px)] [background-size:14px_14px] [mask-image:radial-gradient(circle_at_center,black,transparent_82%)]" />
    </div>
  );
}
