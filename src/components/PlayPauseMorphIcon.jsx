"use client";

export default function PlayPauseMorphIcon({
  className = "",
  color = "#F2555A",
  isPlaying = false,
  size = 56,
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      height={size}
      viewBox="0 0 56 56"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        style={{
          transformBox: "fill-box",
          transformOrigin: "center",
          transition: "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <path
          d="M18 14 L18 42 L40 28 Z"
          fill={color}
          style={{
            opacity: isPlaying ? 0 : 1,
            transform: isPlaying ? "translateX(4px) scaleX(0.38)" : "translateX(0) scaleX(1)",
            transformBox: "fill-box",
            transformOrigin: "center",
            transition:
              "opacity 160ms ease-out, transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
        <rect
          fill={color}
          height="28"
          rx="2"
          style={{
            opacity: isPlaying ? 1 : 0,
            transform: isPlaying ? "translateX(0) scaleY(1)" : "translateX(-5px) scaleY(0.72)",
            transformBox: "fill-box",
            transformOrigin: "center",
            transition:
              "opacity 180ms ease-out 60ms, transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          width="7"
          x="18"
          y="14"
        />
        <rect
          fill={color}
          height="28"
          rx="2"
          style={{
            opacity: isPlaying ? 1 : 0,
            transform: isPlaying ? "translateX(0) scaleY(1)" : "translateX(5px) scaleY(0.72)",
            transformBox: "fill-box",
            transformOrigin: "center",
            transition:
              "opacity 180ms ease-out 60ms, transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          width="7"
          x="31"
          y="14"
        />
      </g>
    </svg>
  );
}
