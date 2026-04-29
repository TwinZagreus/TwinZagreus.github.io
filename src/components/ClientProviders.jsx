"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AuthProvider } from "../context/AuthContext";
import LoginModal from "./LoginModal";

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
      <AuthProvider>
        {children}
        <LoginModal />
      </AuthProvider>
    </ThemeProvider>
  );
}

