"use client";

import { useEffect, useRef } from "react";

// Independent homepage orbit-light controls: 0 = off, 0.5 = current softness, 1 = full intensity.
const ORBIT_LIGHT_INTENSITY = {
  track: 0.1, // 轨道本体
  trail: 0.1, // 流光尾迹
  star: 0.5,  // 星点
  glow: 0.5,  // 辉光与阴影
};

export default function SpaceCanvas({ mode = "home", className = "", pauseWhenOffscreen = false, dustCountOverride = null }) {
  const canvasRef = useRef(null);
  const dustCountRef = useRef(dustCountOverride);
  dustCountRef.current = dustCountOverride;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const constrainedDevice = navigator.connection?.saveData === true
      || (Number.isFinite(navigator.deviceMemory) && navigator.deviceMemory <= 4)
      || (Number.isFinite(navigator.hardwareConcurrency) && navigator.hardwareConcurrency <= 4);
    let frame = 0;
    let isVisible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars = [];
    let galaxyDust = [];
    let appliedDustCount = -1;
    let dustFrame = 0;
    let dustDirty = true;
    const dustCanvas = document.createElement("canvas");
    const dustContext = dustCanvas.getContext("2d");
    const maxRotation = (18 * Math.PI) / 180;
    const flattenedOrbitRatio = 0.08;
    const orbitVerticalScale = 0.42;
    const pointer = { x: 0.5, y: 0.5 };

    const seed = (value) => {
      const x = Math.sin(value * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };

    const createHeadGlowSprite = (ring, brightness) => {
      const size = 24 + ring * 4;
      const sprite = document.createElement("canvas");
      const spriteContext = sprite.getContext("2d");
      const center = size / 2;
      const radius = 6.5 + ring * 1.2;
      const starLight = brightness * ORBIT_LIGHT_INTENSITY.star;

      sprite.width = size;
      sprite.height = size;
      spriteContext.globalCompositeOperation = "lighter";

      const glow = spriteContext.createRadialGradient(center, center, 0, center, center, radius);
      glow.addColorStop(0, `rgba(255, 255, 255, ${0.82 * ORBIT_LIGHT_INTENSITY.glow})`);
      glow.addColorStop(0.16, `rgba(222, 246, 255, ${0.72 * ORBIT_LIGHT_INTENSITY.glow})`);
      glow.addColorStop(0.42, `rgba(104, 166, 255, ${0.42 * brightness * ORBIT_LIGHT_INTENSITY.glow})`);
      glow.addColorStop(1, "rgba(104, 166, 255, 0)");
      spriteContext.fillStyle = glow;
      spriteContext.fillRect(0, 0, size, size);
      spriteContext.beginPath();
      spriteContext.arc(center, center, 1.15 + ring * 0.13, 0, Math.PI * 2);
      spriteContext.fillStyle = `rgba(255, 255, 255, ${0.82 * starLight})`;
      spriteContext.fill();

      return { sprite, size };
    };

    const createTrailSegments = (ring, length, brightness) => {
      const lineWidth = 1.5 + ring * 0.52;
      const trailLight = brightness * ORBIT_LIGHT_INTENSITY.trail;

      return [
        {
          arcLength: length * 2.35,
          color: `rgba(170, 155, 255, ${0.11 * trailLight})`,
          lineWidth: lineWidth + 3.2,
          shadowColor: `rgba(111, 125, 255, ${0.2 * ORBIT_LIGHT_INTENSITY.glow})`,
          shadowBlur: 10,
        },
        {
          arcLength: length * 1.45,
          color: `rgba(89, 146, 255, ${0.28 * trailLight})`,
          lineWidth: lineWidth + 1.2,
          shadowColor: `rgba(74, 154, 255, ${0.36 * ORBIT_LIGHT_INTENSITY.glow})`,
          shadowBlur: 7,
        },
        {
          arcLength: length * 0.68,
          color: `rgba(224, 247, 255, ${0.62 * brightness * ORBIT_LIGHT_INTENSITY.star})`,
          lineWidth,
          shadowColor: `rgba(187, 229, 255, ${0.56 * ORBIT_LIGHT_INTENSITY.glow})`,
          shadowBlur: 5,
        },
      ];
    };

    const orbitShuttles = Array.from({ length: 4 }, (_, ring) => {
      const count = 1 + Math.floor(seed(401 + ring * 31) * 3);

      return Array.from({ length: count }, (_, index) => {
        const variation = ring * 43 + index * 17;
        const length = 0.12 + seed(variation + 451) * 0.2;
        const brightness = 0.56 + seed(variation + 461) * 0.25;
        return {
          phase: seed(variation + 421) * Math.PI * 2,
          direction: seed(variation + 431) > 0.42 ? 1 : -1,
          speed: 0.00015 + seed(variation + 441) * 0.00027,
          glow: createHeadGlowSprite(ring, brightness),
          trailSegments: createTrailSegments(ring, length, brightness),
        };
      });
    });

    const drawSegment = (semiMajor, semiMinor, headAngle, direction, segment) => {
      const startAngle = direction === 1 ? headAngle - segment.arcLength : headAngle + segment.arcLength;
      context.beginPath();
      context.ellipse(0, 0, semiMajor, semiMinor, 0, startAngle, headAngle, direction === -1);
      context.strokeStyle = segment.color;
      context.lineWidth = segment.lineWidth;
      context.shadowColor = segment.shadowColor;
      context.shadowBlur = segment.shadowBlur;
      context.stroke();
    };

    const renderDustLayer = (time, centerX, centerY, rotation) => {
      dustContext.clearRect(0, 0, width, height);
      dustContext.save();
      dustContext.translate(centerX, centerY);
      dustContext.rotate(rotation);
      dustContext.scale(1, orbitVerticalScale);
      dustContext.globalCompositeOperation = "lighter";

      galaxyDust.forEach((dust, index) => {
        const orbitAngle = dust.angle + dust.radius * 0.012 + time * dust.speed;
        const x = Math.cos(orbitAngle) * dust.radius;
        const y = Math.sin(orbitAngle) * dust.radius;

        if (dust.hasTrail) {
          const tailAngle = orbitAngle - 0.035 - dust.radius * 0.00002;
          dustContext.beginPath();
          dustContext.moveTo(Math.cos(tailAngle) * dust.radius, Math.sin(tailAngle) * dust.radius);
          dustContext.lineTo(x, y);
          dustContext.strokeStyle = dust.trailStyle;
          dustContext.lineWidth = dust.size * 0.75;
          dustContext.stroke();
        }

        dustContext.beginPath();
        dustContext.arc(x, y, dust.size * (index % 9 === 0 ? 1.5 : 1), 0, Math.PI * 2);
        dustContext.fillStyle = dust.fillStyle;
        dustContext.fill();
      });

      dustContext.restore();
      dustDirty = false;
    };

    const resolveDustCount = () => {
      if (Number.isInteger(dustCountRef.current)) {
        return Math.min(300, Math.max(0, dustCountRef.current));
      }

      return constrainedDevice
        ? (width < 700 ? 75 : 135)
        : (width < 700 ? 95 : 180);
    };

    const rebuildGalaxyDust = () => {
      const dustCount = resolveDustCount();
      appliedDustCount = dustCount;
      dustFrame = 0;
      dustDirty = dustCount > 0;
      galaxyDust = [];

      if (mode !== "home" || dustCount === 0) {
        dustContext.clearRect(0, 0, width, height);
        return;
      }

      const homeCenterX = width * 0.56;
      const maxHorizontalDistance = Math.max(homeCenterX, width - homeCenterX);
      const orbitReach = (maxHorizontalDistance / (Math.cos(maxRotation) + flattenedOrbitRatio * Math.sin(maxRotation))) * 0.985;
      const galaxyRadius = orbitReach * 1.2;
      const trailCount = constrainedDevice
        ? (width < 700 ? 18 : 36)
        : (width < 700 ? 24 : 48);
      galaxyDust = Array.from({ length: dustCount }, (_, index) => {
        const arm = index % 4;
        const alpha = 0.16 + seed(index + 261) * 0.66;
        const hue = seed(index + 281) > 0.64 ? "172, 137, 255" : "76, 211, 237";
        const size = 0.25 + seed(index + 241) * 1.35;
        return {
          radius: Math.pow(seed(index + 201), 0.58) * galaxyRadius,
          angle: (arm / 4) * Math.PI * 2 + (seed(index + 221) - 0.5) * 0.38,
          size,
          fillStyle: `rgba(${hue}, ${alpha})`,
          trailStyle: `rgba(${hue}, ${alpha * 0.28})`,
          trailStrength: alpha * size,
          speed: 0.000035 + seed(index + 301) * 0.00007,
        };
      });
      [...galaxyDust]
        .sort((a, b) => b.trailStrength - a.trailStrength)
        .slice(0, trailCount)
        .forEach((dust) => { dust.hasTrail = true; });
    };

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      dpr = 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      dustCanvas.width = width * dpr;
      dustCanvas.height = height * dpr;
      dustContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      dustFrame = 0;
      dustDirty = true;
      const count = mode === "home" ? (width < 700 ? 105 : 190) : width < 700 ? 70 : 130;
      stars = Array.from({ length: count }, (_, index) => {
        const angle = seed(index + 9) * Math.PI * 2;
        const radius = Math.pow(seed(index + 41), 0.62) * Math.min(width, height) * 0.72;
        return {
          x: width / 2 + Math.cos(angle) * radius * (mode === "home" ? 1.25 : 1),
          y: height / 2 + Math.sin(angle) * radius * 0.52,
          size: 0.35 + seed(index + 83) * 1.65,
          alpha: 0.18 + seed(index + 19) * 0.72,
          phase: seed(index + 121) * Math.PI * 2,
          speed: 0.00035 + seed(index + 151) * 0.001,
          color: index % 7 === 0 ? "rgb(168, 137, 255)" : "rgb(216, 239, 255)",
        };
      });

      if (mode === "home") rebuildGalaxyDust();
    };

    const draw = (time) => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = mode === "home" ? "rgba(4, 6, 18, 0.42)" : "rgba(3, 5, 15, 0.78)";
      context.fillRect(0, 0, width, height);

      if (mode === "home") {
        if (resolveDustCount() !== appliedDustCount) rebuildGalaxyDust();
        const centerX = width * 0.56 + (pointer.x - 0.5) * 24;
        const centerY = height * 0.46 + (pointer.y - 0.5) * 16;
        const rotation = reducedMotion ? 0 : Math.sin(time * 0.00002) * maxRotation;
        const glow = context.createRadialGradient(centerX, centerY, 4, centerX, centerY, Math.min(width, height) * 0.8);
        glow.addColorStop(0, "rgba(96, 74, 255, 0.22)");
        glow.addColorStop(0.25, "rgba(30, 193, 255, 0.08)");
        glow.addColorStop(1, "rgba(4, 6, 18, 0)");
        context.fillStyle = glow;
        context.fillRect(0, 0, width, height);

        if (galaxyDust.length > 0) {
          if (dustDirty || dustFrame % 3 === 0) {
            renderDustLayer(time, centerX, centerY, rotation);
          }
          dustFrame += 1;

          context.save();
          context.globalCompositeOperation = "lighter";
          context.drawImage(dustCanvas, 0, 0, width, height);
          context.restore();
        }

        context.save();
        context.translate(centerX, centerY);
        context.rotate(rotation);
        context.scale(1, orbitVerticalScale);
        context.globalCompositeOperation = "lighter";
        const orbitReach = (Math.max(centerX, width - centerX) / (Math.cos(maxRotation) + flattenedOrbitRatio * Math.sin(maxRotation))) * 0.985;
        for (let ring = 0; ring < 4; ring += 1) {
          const ringProgress = (ring + 1) / 4;
          const semiMajor = orbitReach * ringProgress;
          const semiMinor = (semiMajor * flattenedOrbitRatio) / orbitVerticalScale;
          const ringOpacity = 0.3 - ring * 0.032;
          const ringGradient = context.createLinearGradient(-semiMajor, 0, semiMajor, 0);

          ringGradient.addColorStop(0, `rgba(170, 155, 255, ${ringOpacity * 0.88 * ORBIT_LIGHT_INTENSITY.track})`);
          ringGradient.addColorStop(0.44, `rgba(116, 137, 255, ${ringOpacity * ORBIT_LIGHT_INTENSITY.track})`);
          ringGradient.addColorStop(0.76, `rgba(71, 152, 255, ${ringOpacity * 1.22 * ORBIT_LIGHT_INTENSITY.track})`);
          ringGradient.addColorStop(1, `rgba(236, 250, 255, ${ringOpacity * 1.08 * ORBIT_LIGHT_INTENSITY.track})`);

          context.beginPath();
          context.ellipse(0, 0, semiMajor, semiMinor, 0, 0, Math.PI * 2);
          context.strokeStyle = ringGradient;
          context.lineWidth = 1.5 + ring * 0.52;
          context.shadowColor = `rgba(94, 138, 255, ${0.36 * ORBIT_LIGHT_INTENSITY.glow})`;
          context.shadowBlur = 1.5 + ring * 0.5;
          context.stroke();

          orbitShuttles[ring].forEach((shuttle) => {
            const headAngle = shuttle.phase + (reducedMotion ? 0 : time * shuttle.speed * shuttle.direction);
            shuttle.trailSegments.forEach((segment) => {
              drawSegment(semiMajor, semiMinor, headAngle, shuttle.direction, segment);
            });

            const headX = Math.cos(headAngle) * semiMajor;
            const headY = Math.sin(headAngle) * semiMinor;
            context.save();
            context.translate(headX, headY);
            context.scale(1, 1 / orbitVerticalScale);
            context.drawImage(shuttle.glow.sprite, -shuttle.glow.size / 2, -shuttle.glow.size / 2);
            context.restore();
          });
        }
        context.restore();

        const pulse = reducedMotion ? 1 : 1 + Math.sin(time * 0.0011) * 0.1;
        const core = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width, height) * 0.15 * pulse);
        core.addColorStop(0, "rgba(255, 248, 231, 0.92)");
        core.addColorStop(0.08, "rgba(255, 188, 132, 0.66)");
        core.addColorStop(0.25, "rgba(165, 129, 255, 0.2)");
        core.addColorStop(1, "rgba(89, 210, 237, 0)");
        context.fillStyle = core;
        context.fillRect(centerX - width * 0.16, centerY - height * 0.16, width * 0.32, height * 0.32);
        context.beginPath();
        context.arc(centerX, centerY, 2.2 * pulse, 0, Math.PI * 2);
        context.fillStyle = "rgba(255, 247, 224, 0.96)";
        context.fill();
      }

      stars.forEach((star, index) => {
        const twinkle = reducedMotion ? 1 : 0.76 + Math.sin(time * star.speed + star.phase) * 0.24;
        const drift = mode === "home" && !reducedMotion ? Math.sin(time * 0.00012 + index) * 0.45 : 0;
        context.beginPath();
        context.arc(star.x + drift, star.y, star.size, 0, Math.PI * 2);
        context.fillStyle = star.color;
        context.globalAlpha = star.alpha * twinkle;
        context.fill();
      });
      context.globalAlpha = 1;

      if (!reducedMotion && isVisible) frame = requestAnimationFrame(draw);
      else frame = 0;
    };

    const move = (event) => {
      if (!isVisible) return;
      pointer.x = event.clientX / window.innerWidth;
      pointer.y = event.clientY / window.innerHeight;
    };

    resize();
    draw(0);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });
    const observer = pauseWhenOffscreen && "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => {
        const nextVisible = entry.intersectionRatio > 0;
        if (nextVisible === isVisible) return;

        isVisible = nextVisible;
        if (!isVisible) {
          cancelAnimationFrame(frame);
          frame = 0;
          return;
        }

        dustDirty = true;
        if (frame === 0) draw(performance.now());
      }, { threshold: 0.01 })
      : null;

    observer?.observe(canvas);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
    };
  }, [mode, pauseWhenOffscreen]);

  return <canvas ref={canvasRef} className={`space-canvas ${className}`.trim()} aria-hidden="true" />;
}
