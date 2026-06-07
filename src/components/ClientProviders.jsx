"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import dynamic from "next/dynamic";
import { AudioPlayerProvider } from "@/context/AudioPlayerContext";
import { ProjectThemeProvider } from "../context/ProjectThemeContext";
import InitialLoadingGate from "./InitialLoadingGate";
import { RouteTransitionProvider } from "./RouteTransitionProvider";
import ThemeSetting from "./ThemeSetting";

const PersistentPerlinBackdrop = dynamic(() => import("./PersistentPerlinBackdrop"), {
  ssr: false,
});

const theme = createTheme({
  typography: {
    fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
  },
},
);

export default function ClientProviders({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ProjectThemeProvider>
        <AudioPlayerProvider>
          <RouteTransitionProvider>
            <PersistentPerlinBackdrop />
            <InitialLoadingGate deferredControls={<ThemeSetting />}>
              {children}
            </InitialLoadingGate>
          </RouteTransitionProvider>
        </AudioPlayerProvider>
      </ProjectThemeProvider>
    </ThemeProvider>
  );
}
