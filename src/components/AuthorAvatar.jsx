"use client";

import { alpha } from "@mui/material/styles";
import { useProjectTheme } from "@/context/ProjectThemeContext";

const SHAPE_CLASS_MAP = {
  circle: "rounded-full",
  portrait: "rounded-[2px]",
  soft: "rounded-xl",
};

export default function AuthorAvatar({
  alt = "TwinZ portrait",
  caption = "TWINZ / AUTHOR",
  className = "",
  imageUrl = "/img/my.png",
  shape = "circle",
  size = "clamp(72px, 8vw, 112px)",
}) {
  const { colorMap } = useProjectTheme();
  const shapeClassName = SHAPE_CLASS_MAP[shape] ?? SHAPE_CLASS_MAP.circle;

  return (
    <figure
      className={`pointer-events-none inline-grid gap-2 ${className}`}
      style={{ width: size }}
    >
      <div
        className={`relative aspect-square overflow-hidden border ${shapeClassName}`}
        style={{
          backgroundColor: alpha(colorMap.coral100, 0.6),
          borderColor: alpha(colorMap.neutral700, 0.45),
        }}
      >
        <img
          alt={alt}
          className="h-full w-full object-cover"
          draggable={false}
          src={imageUrl}
          style={{ objectPosition: "50% 34%" }}
        />
      </div>
      {caption ? (
        <figcaption
          className="text-center text-[9px] uppercase leading-none tracking-[0.24em]"
          style={{ color: colorMap.neutral700 }}
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
