"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AuthProvider } from "../context/AuthContext";
import { ProjectThemeProvider } from "../context/ProjectThemeContext";
import LoginModal from "./LoginModal";
import ThemeSetting from "./ThemeSetting";

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
        <AuthProvider>
          {children}
          <LoginModal />
          <ThemeSetting />
        </AuthProvider>
      </ProjectThemeProvider>
    </ThemeProvider>
  );
}
