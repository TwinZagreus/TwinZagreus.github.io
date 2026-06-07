"use client";

import { alpha } from "@mui/material/styles";
import { MAIN_BACKGROUND_COLOR, PROJECT_COLOR_MAP } from "@/lib/theme";

const TAU = Math.PI * 2;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function valueToPoint(value, radius, center) {
  const angle = value * TAU - Math.PI / 2;
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  };
}

function eventToValue(event, element) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;
  const angle = Math.atan2(dy, dx) + Math.PI / 2;
  return ((angle % TAU) + TAU) % TAU / TAU;
}

export default function CircularKnob({
  color = PROJECT_COLOR_MAP.coral,
  hitAreaColor = PROJECT_COLOR_MAP.coral100,
  label,
  onChange,
  onInteractionEnd,
  onInteractionStart,
  thumbColor = MAIN_BACKGROUND_COLOR,
  trackColor = alpha(PROJECT_COLOR_MAP.ink950, 0.16),
  value = 0,
}) {
  const normalizedValue = clamp01(value);
  const center = 32;
  const radius = 28;
  const circumference = TAU * radius;
  const point = valueToPoint(normalizedValue, radius, center);

  const updateFromEvent = (event) => {
    onChange(eventToValue(event, event.currentTarget.ownerSVGElement ?? event.currentTarget));
  };

  const handlePointerDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    onInteractionStart?.();
    updateFromEvent(event);
  };

  const handlePointerMove = (event) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId))
      return;
    event.preventDefault();
    event.stopPropagation();
    updateFromEvent(event);
  };

  const handlePointerUp = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onInteractionEnd?.();
  };

  const handlePointerCancel = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onInteractionEnd?.();
  };

  return (
    <svg
      aria-label={label}
      className="pointer-events-none absolute -inset-1 z-10 h-[calc(100%+0.5rem)] w-[calc(100%+0.5rem)] touch-none overflow-visible"
      onClick={(event) => event.stopPropagation()}
      role="slider"
      viewBox="0 0 64 64"
    >
      <circle
        cx={center}
        cy={center}
        fill="none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerCancel={handlePointerCancel}
        onPointerUp={handlePointerUp}
        r={radius}
        stroke={hitAreaColor}
        strokeOpacity={0}
        strokeWidth="12"
        style={{ pointerEvents: "stroke" }}
      />
      <circle
        cx={center}
        cy={center}
        fill="none"
        r={radius}
        stroke={trackColor}
        strokeWidth="1.5"
      />
      <circle
        cx={center}
        cy={center}
        fill="none"
        r={radius}
        stroke={color}
        strokeDasharray={`${circumference * normalizedValue} ${circumference}`}
        strokeLinecap="round"
        strokeWidth="2"
        style={{
          transform: "rotate(-90deg)",
          transformBox: "fill-box",
          transformOrigin: "center",
        }}
      />
      <circle
        cx={point.x}
        cy={point.y}
        fill={thumbColor}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerCancel={handlePointerCancel}
        onPointerUp={handlePointerUp}
        r="4"
        stroke={color}
        strokeWidth="2"
        style={{ pointerEvents: "all" }}
      />
    </svg>
  );
}
