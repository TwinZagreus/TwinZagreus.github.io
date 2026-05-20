"use client";

import Button from "@mui/material/Button";
import { alpha } from "@mui/material/styles";
import { useProjectTheme } from "@/context/ProjectThemeContext";
import { NavLink } from "../lib/navigation";

const FONT_FAMILY = ['Trebuchet MS', 'Segoe UI', "sans-serif"].join(",");

function getToneSx(tone, active, colorMap) {
  switch (tone) {
    case "primary":
      return {
        borderColor: "#d8d2c8",
        bgcolor: colorMap.coral,
        color: "#ffffff",
        "&:hover": { borderColor: colorMap.ink700, bgcolor: colorMap.ink700 },
      };
    case "danger":
      return {
        borderColor: "#d8d2c8",
        bgcolor: colorMap.ink700,
        color: "#ffffff",
        "&:hover": { borderColor: colorMap.ink800, bgcolor: colorMap.ink800 },
      };
    case "overlay":
      return {
        borderColor: "#d7d2c7",
        bgcolor: alpha("#fbfaf7", 0.9),
        color: colorMap.neutral900,
        backdropFilter: "blur(14px)",
        "&:hover": { borderColor: colorMap.coral400, bgcolor: "#ffffff", color: colorMap.ink800 },
      };
    case "darkOverlay":
      return {
        borderColor: alpha("#ffffff", 0.1),
        bgcolor: alpha("#000000", 0.1),
        color: alpha("#ffffff", 0.7),
        backdropFilter: "blur(14px)",
        "&:hover": { borderColor: alpha("#ffffff", 0.1), bgcolor: alpha("#ffffff", 0.1), color: "#ffffff" },
      };
    case "nav":
      return active
        ? {
            borderColor: colorMap.coral600,
            bgcolor: colorMap.coral100,
            color: colorMap.ink700,
            "&:hover": { borderColor: colorMap.coral600, bgcolor: colorMap.coral100 },
          }
        : {
            borderColor: "#d9d4ca",
            bgcolor: alpha("#fbfaf7", 0.9),
            color: colorMap.neutral900,
            "&:hover": { borderColor: colorMap.coral400, bgcolor: "#ffffff", color: colorMap.ink800 },
          };
    case "ghost":
      return {
        borderColor: "#d8d2c8",
        bgcolor: "transparent",
        color: colorMap.neutral900,
        "&:hover": { borderColor: colorMap.coral400, bgcolor: "#ffffff" },
      };
    case "surface":
    default:
      return {
        borderColor: "#d8d2c8",
        bgcolor: "#ffffff",
        color: colorMap.neutral900,
        "&:hover": { borderColor: colorMap.coral400, bgcolor: colorMap.coral100, color: colorMap.ink700 },
      };
  }
}

function buttonSx({ tone = "surface", active = false, colorMap, fullWidth = false, sx }) {
  return {
    minWidth: 0,
    px: 2,
    py: 1,
    borderRadius: "999px",
    borderWidth: "1px",
    borderStyle: "solid",
    boxShadow: "none",
    fontFamily: FONT_FAMILY,
    fontSize: "10px",
    lineHeight: 1.2,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    transition: "all 200ms ease-out",
    width: fullWidth ? "100%" : "auto",
    ...getToneSx(tone, active, colorMap),
    ...sx,
  };
}

export function AppButton({ tone = "surface", active = false, sx, fullWidth = false, ...props }) {
  const { colorMap } = useProjectTheme();

  return <Button disableElevation sx={buttonSx({ tone, active, colorMap, sx, fullWidth })} variant="outlined" {...props} />;
}

export function AppNavButton({ sx, tone = "nav", ...props }) {
  return (
    <NavLink {...props}>
      {({ isActive }) => (
        <AppButton active={isActive} component="span" sx={sx} tone={tone}>
          {props.children}
        </AppButton>
      )}
    </NavLink>
  );
}
