import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Link } from "react-router-dom";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import * as THREE from "three";

const WIDTH = 1600;
const HEIGHT = 900;

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform sampler2D uTexture;
  uniform sampler2D uDepth;
  uniform vec2 uPointer;
  uniform float uProgress;
  uniform float uAspect;

  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(234.34, 546.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float cellNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float res = 1.0;

    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 neighbor = vec2(float(x), float(y));
        vec2 point = vec2(hash(i + neighbor), hash(i + neighbor + 19.13));
        vec2 diff = neighbor + point - f;
        res = min(res, length(diff));
      }
    }

    return res;
  }

  vec3 blendScreen(vec3 base, vec3 blend) {
    return 1.0 - (1.0 - base) * (1.0 - blend);
  }

  void main() {
    vec2 pointer = uPointer * 0.01;
    float depth = texture2D(uDepth, vUv).r;
    vec2 displacedUv = vUv + depth * pointer;

    vec3 mapColor = texture2D(uTexture, displacedUv).rgb;

    vec2 tuv = vec2(vUv.x * uAspect, vUv.y);
    vec2 tiledUv = mod(tuv * 120.0, 2.0) - 1.0;
    float brightness = 1.0 - smoothstep(0.0, 1.0, cellNoise((tuv * 120.0) / 2.0));
    float dotMask = smoothstep(0.5, 0.49, length(tiledUv)) * brightness;

    float flow = 1.0 - smoothstep(0.0, 0.02, abs(depth - uProgress));
    vec3 scanMask = dotMask * flow * vec3(10.0, 0.0, 0.0);

    vec3 finalColor = blendScreen(mapColor, scanMask);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function useCoverScale(width, height) {
  const { viewport } = useThree();
  const aspect = width / height;

  return useMemo(() => {
    let w = viewport.width;
    let h = w / aspect;

    if (h < viewport.height) {
      h = viewport.height;
      w = h * aspect;
    }

    return [w, h, 1];
  }, [aspect, viewport.height, viewport.width]);
}

function ScanEffectScene({ setLoaded }) {
  const [rawMap, depthMap] = useLoader(THREE.TextureLoader, [
    "/scan-effect/raw-1.png",
    "/scan-effect/depth-1.png",
  ]);
  const scale = useCoverScale(WIDTH, HEIGHT);
  const materialRef = useRef(null);
  const progressRef = useRef({ value: 0 });

  useEffect(() => {
    rawMap.colorSpace = THREE.SRGBColorSpace;
    setLoaded(true);
  }, [rawMap, setLoaded]);

  useEffect(() => {
    const tween = gsap.to(progressRef.current, {
      value: 1,
      duration: 3,
      ease: "power1.out",
      repeat: -1,
      repeatDelay: 0,
    });

    return () => {
      tween.kill();
    };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTexture: { value: rawMap },
      uDepth: { value: depthMap },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uProgress: { value: 0 },
      uAspect: { value: WIDTH / HEIGHT },
    }),
    [depthMap, rawMap],
  );

  useFrame(({ pointer }) => {
    if (!materialRef.current) {
      return;
    }

    uniforms.uPointer.value.lerp(pointer, 0.08);
    uniforms.uProgress.value = progressRef.current.value;
  });

  return (
    <mesh scale={scale}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function ScanEffectRoute() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      <div
        className={`pointer-events-none fixed inset-0 z-30 flex items-center justify-center bg-[#3b160d] transition-opacity duration-500 ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="h-5 w-5 rounded-full bg-white animate-ping" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-5 py-5 sm:px-7">
        <div className="text-[10px] uppercase tracking-[0.32em] text-white/48">
          Stable scan study inspired by
          <span className="ml-2 text-white/78">ScanningEffectWithDepthMap</span>
        </div>
        <div className="pointer-events-auto">
          <Link
            className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-white/74 backdrop-blur-md transition duration-200 ease-out hover:bg-white/10 hover:text-white"
            to="/"
          >
            Back Home
          </Link>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-5 py-6 sm:px-7">
        <div className="max-w-xl text-[11px] uppercase tracking-[0.28em] text-white/55">
          WebGL shader route using image displacement, depth scan progress, and tiled procedural masking
        </div>
      </div>

      <div className="h-screen">
        <Canvas dpr={[1, 1.5]} gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}>
          <Suspense fallback={null}>
            <ScanEffectScene setLoaded={setIsLoaded} />
          </Suspense>
        </Canvas>
      </div>
    </main>
  );
}
