"use client";

import { Link } from "../lib/navigation";
import { useAuth } from "../context/AuthContext";
import { AppButton, AppNavButton } from "./AppButton";

export default function BlogLayout({ children }) {
  const { isAuthenticated, openLoginModal, logout, username } = useAuth();

  return (
    <main className="min-h-screen bg-[#f5f2ea] text-[#45443e]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1240px] flex-col px-4 pb-10 pt-5 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-40 rounded-[30px] border border-[#ddd7cc] bg-[#fbfaf6]/92 px-4 py-4 shadow-[0_18px_48px_rgba(80,66,43,0.08)] backdrop-blur-md sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <AppButton component={Link} sx={{ letterSpacing: "0.32em", color: "#726d62" }} to="/">
                Perlin
              </AppButton>
              <div>
                <div className="text-[10px] uppercase tracking-[0.34em] text-[#8a8476]">Motorsport Journal</div>
                <div className="mt-1 text-lg uppercase tracking-[0.12em] text-[#464540]">Editorial Blog System</div>
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
                  Login / 鐧诲綍
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
