import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const trailFragmentShader = `
  precision highp float;

  varying vec2 vUv;

  uniform sampler2D uPrev;
  uniform vec2 uPointer;
  uniform vec2 uPrevPointer;
  uniform float uAspect;
  uniform float uRadius;
  uniform float uStrength;
  uniform float uDissipate;
  uniform float uActive;
  uniform float uVelocity;

  float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    vec2 texel = vec2(1.0 / 1024.0);
    vec4 prev = texture2D(uPrev, vUv) * uDissipate;
    float bleed =
      texture2D(uPrev, vUv + vec2(texel.x, 0.0)).r +
      texture2D(uPrev, vUv - vec2(texel.x, 0.0)).r +
      texture2D(uPrev, vUv + vec2(0.0, texel.x)).r +
      texture2D(uPrev, vUv - vec2(0.0, texel.x)).r;
    float trail = max(prev.r, bleed * 0.08);

    if (uActive > 0.5) {
      vec2 point = vUv;
      vec2 from = uPrevPointer;
      vec2 to = uPointer;
      point.x *= uAspect;
      from.x *= uAspect;
      to.x *= uAspect;

      float radius = mix(uRadius * 0.85, uRadius * 1.4, clamp(uVelocity, 0.0, 1.0));
      float segment = sdSegment(point, from, to);
      float brush = 1.0 - smoothstep(radius * 0.22, radius, segment);
      trail = max(trail, brush * uStrength);
    }

    gl_FragColor = vec4(vec3(clamp(trail, 0.0, 1.0)), 1.0);
  }
`;

const revealFragmentShader = `
  precision highp float;

  varying vec2 vUv;

  uniform sampler2D uBase;
  uniform sampler2D uMask;
  uniform sampler2D uTrail;
  uniform vec2 uResolution;
  uniform vec2 uBaseSize;
  uniform vec2 uMaskSize;
  uniform float uBaseScale;
  uniform vec2 uBaseOffset;
  uniform float uMaskScale;
  uniform vec2 uMaskOffset;
  uniform float uMaskAlwaysVisible;

  vec3 linearToSrgb(vec3 color) {
    vec3 cutoff = step(vec3(0.0031308), color);
    vec3 lower = color * 12.92;
    vec3 higher = 1.055 * pow(max(color, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055;
    return mix(lower, higher, cutoff);
  }

  vec2 coverUv(vec2 uv, vec2 textureSize, vec2 viewportSize, float scale, vec2 offset) {
    float viewportAspect = viewportSize.x / max(viewportSize.y, 1.0);
    float textureAspect = textureSize.x / max(textureSize.y, 1.0);
    vec2 scaled = uv - 0.5;

    if (viewportAspect > textureAspect) {
      scaled.y *= textureAspect / viewportAspect;
    } else {
      scaled.x *= viewportAspect / textureAspect;
    }

    scaled = (scaled - offset) / max(scale, 0.01);

    return scaled + 0.5;
  }

  vec4 sampleClampedTexture(sampler2D tex, vec2 uv) {
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      return vec4(0.0);
    }

    return texture2D(tex, uv);
  }

  float trailSample(vec2 uv) {
    vec2 texel = 1.0 / max(uResolution, vec2(1.0));
    float center = texture2D(uTrail, uv).r * 0.42;
    float ring =
      texture2D(uTrail, uv + vec2(texel.x, 0.0)).r * 0.14 +
      texture2D(uTrail, uv - vec2(texel.x, 0.0)).r * 0.14 +
      texture2D(uTrail, uv + vec2(0.0, texel.y)).r * 0.14 +
      texture2D(uTrail, uv - vec2(0.0, texel.y)).r * 0.14;
    float corners =
      texture2D(uTrail, uv + texel).r * 0.04 +
      texture2D(uTrail, uv - texel).r * 0.04 +
      texture2D(uTrail, uv + vec2(texel.x, -texel.y)).r * 0.04 +
      texture2D(uTrail, uv + vec2(-texel.x, texel.y)).r * 0.04;

    return center + ring + corners;
  }

  void main() {
    vec2 baseUv = coverUv(vUv, uBaseSize, uResolution, uBaseScale, uBaseOffset);
    vec2 maskUv = coverUv(vUv, uMaskSize, uResolution, uMaskScale, uMaskOffset);

    vec4 baseColor = sampleClampedTexture(uBase, baseUv);
    vec4 maskColor = sampleClampedTexture(uMask, maskUv);

    float trail = trailSample(vUv);
    float reveal = max(smoothstep(0.12, 0.58, trail), uMaskAlwaysVisible);

    vec3 color = mix(baseColor.rgb, maskColor.rgb, reveal);
    float alpha = max(baseColor.a, mix(baseColor.a, maskColor.a, reveal));

    gl_FragColor = vec4(linearToSrgb(color), alpha);
  }
`;

function createRenderTarget(width, height) {
  return new THREE.WebGLRenderTarget(width, height, {
    depthBuffer: false,
    format: THREE.RGBAFormat,
    magFilter: THREE.LinearFilter,
    minFilter: THREE.LinearFilter,
    stencilBuffer: false,
    type: THREE.UnsignedByteType,
  });
}

function MouseRevealScene({ controlsRef, onReady }) {
  const { gl, size } = useThree();
  const [baseTexture, maskTexture] = useLoader(THREE.TextureLoader, ["/img/my.png", "/img/mask-01.png"]);
  const readySentRef = useRef(false);

  const revealMaterialRef = useRef(null);
  const targetPointerRef = useRef(new THREE.Vector2(0.5, 0.5));
  const smoothedPointerRef = useRef(new THREE.Vector2(0.5, 0.5));
  const previousPointerRef = useRef(new THREE.Vector2(0.5, 0.5));
  const trailActiveRef = useRef(false);

  const trailRenderRef = useRef(null);
  const trailSwapRef = useRef(null);

  if (!trailRenderRef.current) {
    const width = Math.max(1, Math.floor(size.width * 0.6));
    const height = Math.max(1, Math.floor(size.height * 0.6));
    trailRenderRef.current = createRenderTarget(width, height);
    trailSwapRef.current = createRenderTarget(width, height);
  }

  const trailSetup = useMemo(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      fragmentShader: trailFragmentShader,
      uniforms: {
        uActive: { value: 0 },
        uAspect: { value: 1 },
        uDissipate: { value: 0.965 },
        uPointer: { value: new THREE.Vector2(0.5, 0.5) },
        uPrev: { value: null },
        uPrevPointer: { value: new THREE.Vector2(0.5, 0.5) },
        uRadius: { value: 0.085 },
        uStrength: { value: 1.0 },
        uVelocity: { value: 0 },
      },
      vertexShader,
    });
    const quad = new THREE.Mesh(geometry, material);
    scene.add(quad);

    return { camera, geometry, material, scene };
  }, []);

  const revealUniformsRef = useRef({
    uBase: { value: baseTexture },
    uBaseOffset: { value: new THREE.Vector2(0, 0) },
    uBaseScale: { value: 1 },
    uBaseSize: { value: new THREE.Vector2(1, 1) },
    uMask: { value: maskTexture },
    uMaskAlwaysVisible: { value: 0 },
    uMaskOffset: { value: new THREE.Vector2(0, 0) },
    uMaskScale: { value: 1 },
    uMaskSize: { value: new THREE.Vector2(1, 1) },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uTrail: { value: trailRenderRef.current.texture },
  });

  useEffect(() => {
    [baseTexture, maskTexture].forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.anisotropy = gl.capabilities.getMaxAnisotropy();
      texture.needsUpdate = true;
    });

    revealUniformsRef.current.uBase.value = baseTexture;
    revealUniformsRef.current.uMask.value = maskTexture;
    revealUniformsRef.current.uBaseSize.value.set(baseTexture.image.width, baseTexture.image.height);
    revealUniformsRef.current.uMaskSize.value.set(maskTexture.image.width, maskTexture.image.height);

    if (!readySentRef.current) {
      readySentRef.current = true;
      onReady?.();
    }
  }, [baseTexture, gl, maskTexture, onReady]);

  useEffect(() => {
    revealUniformsRef.current.uResolution.value.set(size.width, size.height);
    trailSetup.material.uniforms.uAspect.value = size.width / Math.max(size.height, 1);

    const width = Math.max(1, Math.floor(size.width * 0.6));
    const height = Math.max(1, Math.floor(size.height * 0.6));
    trailRenderRef.current.setSize(width, height);
    trailSwapRef.current.setSize(width, height);
  }, [size, trailSetup]);

  useEffect(() => {
    const handlePointerMove = (event) => {
      targetPointerRef.current.set(
        event.clientX / window.innerWidth,
        1 - event.clientY / window.innerHeight,
      );
      trailActiveRef.current = true;
    };

    const handlePointerLeave = () => {
      trailActiveRef.current = false;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  useEffect(() => {
    return () => {
      trailRenderRef.current?.dispose();
      trailSwapRef.current?.dispose();
      trailSetup.geometry.dispose();
      trailSetup.material.dispose();
    };
  }, [trailSetup]);

  useFrame((_, delta) => {
    const revealMaterial = revealMaterialRef.current;
    if (!revealMaterial) {
      return;
    }

    const follow = trailActiveRef.current ? 0.22 : 0.08;
    smoothedPointerRef.current.lerp(targetPointerRef.current, follow);

    const velocity = THREE.MathUtils.clamp(
      smoothedPointerRef.current.distanceTo(previousPointerRef.current) / Math.max(delta, 1 / 120),
      0,
      1.2,
    );

    trailSetup.material.uniforms.uPrev.value = trailRenderRef.current.texture;
    trailSetup.material.uniforms.uPointer.value.copy(smoothedPointerRef.current);
    trailSetup.material.uniforms.uPrevPointer.value.copy(previousPointerRef.current);
    trailSetup.material.uniforms.uActive.value = trailActiveRef.current ? 1 : 0;
    trailSetup.material.uniforms.uVelocity.value = velocity;

    gl.setRenderTarget(trailSwapRef.current);
    gl.render(trailSetup.scene, trailSetup.camera);
    gl.setRenderTarget(null);

    const current = trailRenderRef.current;
    trailRenderRef.current = trailSwapRef.current;
    trailSwapRef.current = current;

    revealMaterial.uniforms.uTrail.value = trailRenderRef.current.texture;
    revealMaterial.uniforms.uBaseScale.value = THREE.MathUtils.damp(
      revealMaterial.uniforms.uBaseScale.value,
      controlsRef.current.baseScale,
      10,
      delta,
    );
    revealMaterial.uniforms.uMaskScale.value = THREE.MathUtils.damp(
      revealMaterial.uniforms.uMaskScale.value,
      controlsRef.current.maskScale,
      10,
      delta,
    );
    revealMaterial.uniforms.uBaseOffset.value.lerp(
      new THREE.Vector2(controlsRef.current.baseOffsetX, controlsRef.current.baseOffsetY),
      0.14,
    );
    revealMaterial.uniforms.uMaskOffset.value.lerp(
      new THREE.Vector2(controlsRef.current.maskOffsetX, controlsRef.current.maskOffsetY),
      0.14,
    );
    revealMaterial.uniforms.uMaskAlwaysVisible.value = THREE.MathUtils.damp(
      revealMaterial.uniforms.uMaskAlwaysVisible.value,
      controlsRef.current.maskAlwaysVisible ? 1 : 0,
      12,
      delta,
    );
    previousPointerRef.current.copy(smoothedPointerRef.current);
  });

  return (
    <mesh renderOrder={1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={revealMaterialRef}
        depthTest={false}
        depthWrite={false}
        fragmentShader={revealFragmentShader}
        transparent
        uniforms={revealUniformsRef.current}
        vertexShader={vertexShader}
      />
    </mesh>
  );
}

export default function MouseRevealLayer({ controlsRef, onReady }) {
  const canvasHostRef = useRef(null);
  const [eventSource, setEventSource] = useState(null);

  useEffect(() => {
    setEventSource(canvasHostRef.current);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10" ref={canvasHostRef}>
      {eventSource ? (
        <Canvas
          dpr={[1.5, 2.5]}
          eventPrefix="client"
          eventSource={eventSource}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          orthographic
          camera={{ position: [0, 0, 1], zoom: 1 }}
        >
          <MouseRevealScene controlsRef={controlsRef} onReady={onReady} />
        </Canvas>
      ) : null}
    </div>
  );
}
