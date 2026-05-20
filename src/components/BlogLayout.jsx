"use client";

import { Link } from "../lib/navigation";
import { useAuth } from "../context/AuthContext";
import { useProjectTheme } from "../context/ProjectThemeContext";
import { AppButton, AppNavButton } from "./AppButton";

export default function BlogLayout({ children }) {
  const { isAuthenticated, openLoginModal, logout, username } = useAuth();
  const { colorMap } = useProjectTheme();

  return (
    <main className="min-h-screen text-[#45443e]" style={{ backgroundColor: colorMap.coral100 }}>
      <div className="mx-auto flex min-h-screen w-full max-w-[1240px] flex-col px-4 pb-10 pt-5 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-40 rounded-[30px] border bg-[#fbfaf6]/92 px-4 py-4 shadow-[0_18px_48px_rgba(80,66,43,0.08)] backdrop-blur-md sm:px-6" style={{ borderColor: colorMap.coral400 }}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <AppButton component={Link} sx={{ letterSpacing: "0.32em", color: "#726d62" }} to="/">
                Perlin
              </AppButton>
              <div>
                <div className="text-[10px] uppercase tracking-[0.34em]" style={{ color: colorMap.neutral900 }}>Motorsport Journal</div>
                <div className="mt-1 text-lg uppercase tracking-[0.12em]" style={{ color: colorMap.ink800 }}>Editorial Blog System</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <AppNavButton to="/blog">Blog Index</AppNavButton>
              {isAuthenticated ? <AppNavButton to="/blog/new">New Post</AppNavButton> : null}
              {isAuthenticated ? (
                <AppButton onClick={logout} tone="primary" type="button">
                  Logout {username ? `/ ${username}` : ""}
                </AppButton>
              ) : (
                <AppButton onClick={() => openLoginModal()} type="button">
                  Login / 登录
                </AppButton>
              )}
            </div>
          </div>
        </header>

        <div className="mt-6 flex-1">{children}</div>
      </div>
    </main>
  );
}
