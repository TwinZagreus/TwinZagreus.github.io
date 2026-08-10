"use client";

import { useEffect, useRef } from "react";

export default function SpaceCanvas({ mode = "home", className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars = [];
    let galaxyDust = [];
    const maxRotation = (18 * Math.PI) / 180;
    const flattenedOrbitRatio = 0.08;
    const orbitVerticalScale = 0.42;
    const pointer = { x: 0.5, y: 0.5 };

    const seed = (value) => {
      const x = Math.sin(value * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
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
        };
      });

      if (mode === "home") {
        const dustCount = width < 700 ? 155 : 285;
        const homeCenterX = width * 0.56;
        const maxHorizontalDistance = Math.max(homeCenterX, width - homeCenterX);
        const orbitReach = (maxHorizontalDistance / (Math.cos(maxRotation) + flattenedOrbitRatio * Math.sin(maxRotation))) * 0.985;
        const galaxyRadius = orbitReach * 0.94;
        galaxyDust = Array.from({ length: dustCount }, (_, index) => {
          const arm = index % 4;
          return {
            radius: Math.pow(seed(index + 201), 0.58) * galaxyRadius,
            angle: (arm / 4) * Math.PI * 2 + (seed(index + 221) - 0.5) * 0.38,
            size: 0.25 + seed(index + 241) * 1.35,
            alpha: 0.16 + seed(index + 261) * 0.66,
            hue: seed(index + 281) > 0.64 ? "172, 137, 255" : "76, 211, 237",
            speed: 0.000035 + seed(index + 301) * 0.00007,
          };
        });
      }
    };

    const draw = (time) => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = mode === "home" ? "rgba(4, 6, 18, 0.42)" : "rgba(3, 5, 15, 0.78)";
      context.fillRect(0, 0, width, height);

      if (mode === "home") {
        const centerX = width * 0.56 + (pointer.x - 0.5) * 24;
        const centerY = height * 0.46 + (pointer.y - 0.5) * 16;
        const rotation = reducedMotion ? 0 : Math.sin(time * 0.00002) * maxRotation;
        const glow = context.createRadialGradient(centerX, centerY, 4, centerX, centerY, Math.min(width, height) * 0.8);
        glow.addColorStop(0, "rgba(96, 74, 255, 0.22)");
        glow.addColorStop(0.25, "rgba(30, 193, 255, 0.08)");
        glow.addColorStop(1, "rgba(4, 6, 18, 0)");
        context.fillStyle = glow;
        context.fillRect(0, 0, width, height);

        context.save();
        context.translate(centerX, centerY);
        context.rotate(rotation);
        context.scale(1, orbitVerticalScale);
        context.globalCompositeOperation = "lighter";
        galaxyDust.forEach((dust, index) => {
          const orbitAngle = dust.angle + dust.radius * 0.012 + time * dust.speed;
          const x = Math.cos(orbitAngle) * dust.radius;
          const y = Math.sin(orbitAngle) * dust.radius;
          const tailAngle = orbitAngle - 0.035 - dust.radius * 0.00002;
          const tailX = Math.cos(tailAngle) * dust.radius;
          const tailY = Math.sin(tailAngle) * dust.radius;
          context.beginPath();
          context.moveTo(tailX, tailY);
          context.lineTo(x, y);
          context.strokeStyle = `rgba(${dust.hue}, ${dust.alpha * 0.28})`;
          context.lineWidth = dust.size * 0.75;
          context.stroke();
          context.beginPath();
          context.arc(x, y, dust.size * (index % 9 === 0 ? 1.5 : 1), 0, Math.PI * 2);
          context.fillStyle = `rgba(${dust.hue}, ${dust.alpha})`;
          context.fill();
        });
        const orbitReach = (Math.max(centerX, width - centerX) / (Math.cos(maxRotation) + flattenedOrbitRatio * Math.sin(maxRotation))) * 0.985;
        for (let ring = 0; ring < 4; ring += 1) {
          const ringProgress = (ring + 1) / 4;
          const semiMajor = orbitReach * ringProgress;
          const semiMinor = (semiMajor * flattenedOrbitRatio) / orbitVerticalScale;
          context.beginPath();
          context.ellipse(0, 0, semiMajor, semiMinor, 0, 0, Math.PI * 2);
          context.strokeStyle = `rgba(${ring % 2 ? "165, 112, 255" : "53, 206, 255"}, ${0.11 - ring * 0.014})`;
          context.lineWidth = 1.2 + ring * 0.45;
          context.stroke();
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
        context.fillStyle = `rgba(${index % 7 === 0 ? "168, 137, 255" : "216, 239, 255"}, ${star.alpha * twinkle})`;
        context.fill();
      });

      if (!reducedMotion) frame = requestAnimationFrame(draw);
    };

    const move = (event) => {
      pointer.x = event.clientX / window.innerWidth;
      pointer.y = event.clientY / window.innerHeight;
    };

    resize();
    draw(0);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
    };
  }, [mode]);

  return <canvas ref={canvasRef} className={`space-canvas ${className}`.trim()} aria-hidden="true" />;
}
