import Button from "@mui/material/Button";
import { alpha } from "@mui/material/styles";
import { NavLink } from "react-router-dom";

const FONT_FAMILY = ['Trebuchet MS', 'Segoe UI', "sans-serif"].join(",");

function getToneSx(tone, active) {
  switch (tone) {
    case "primary":
      return {
        borderColor: "#d8d2c8",
        bgcolor: "#4f6550",
        color: "#ffffff",
        "&:hover": { borderColor: "#445744", bgcolor: "#445744" },
      };
    case "danger":
      return {
        borderColor: "#d8d2c8",
        bgcolor: "#5e413c",
        color: "#ffffff",
        "&:hover": { borderColor: "#4d342f", bgcolor: "#4d342f" },
      };
    case "overlay":
      return {
        borderColor: "#d7d2c7",
        bgcolor: alpha("#fbfaf7", 0.9),
        color: "#706d63",
        backdropFilter: "blur(14px)",
        "&:hover": { borderColor: "#d7d2c7", bgcolor: "#ffffff", color: "#494d48" },
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
            borderColor: "#b9c1af",
            bgcolor: "#eef2e8",
            color: "#4d5e49",
            "&:hover": { borderColor: "#b9c1af", bgcolor: "#eef2e8" },
          }
        : {
            borderColor: "#d9d4ca",
            bgcolor: alpha("#fbfaf7", 0.9),
            color: "#6d685d",
            "&:hover": { borderColor: "#d9d4ca", bgcolor: "#ffffff", color: "#4a4e48" },
          };
    case "ghost":
      return {
        borderColor: "#d8d2c8",
        bgcolor: "transparent",
        color: "#6b665c",
        "&:hover": { borderColor: "#d8d2c8", bgcolor: "#ffffff" },
      };
    case "surface":
    default:
      return {
        borderColor: "#d8d2c8",
        bgcolor: "#ffffff",
        color: "#666255",
        "&:hover": { borderColor: "#d8d2c8", bgcolor: "#f3f6ef", color: "#4d634d" },
      };
  }
}

function buttonSx({ tone = "surface", active = false, fullWidth = false, sx }) {
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
    ...getToneSx(tone, active),
    ...sx,
  };
}

export function AppButton({ tone = "surface", active = false, sx, fullWidth = false, ...props }) {
  return <Button disableElevation sx={buttonSx({ tone, active, sx, fullWidth })} variant="outlined" {...props} />;
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
