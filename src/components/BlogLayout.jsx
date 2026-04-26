import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function navClassName({ isActive }) {
  return [
    "rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.26em] transition duration-200 ease-out",
    isActive
      ? "border-[#b9c1af] bg-[#eef2e8] text-[#4d5e49]"
      : "border-[#d9d4ca] bg-[#fbfaf7]/90 text-[#6d685d] hover:bg-white hover:text-[#4a4e48]",
  ].join(" ");
}

export default function BlogLayout({ children }) {
  const { isAuthenticated, openLoginModal, logout, username } = useAuth();

  return (
    <main className="min-h-screen bg-[#f5f2ea] text-[#45443e]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1240px] flex-col px-4 pb-10 pt-5 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-40 rounded-[30px] border border-[#ddd7cc] bg-[#fbfaf6]/92 px-4 py-4 shadow-[0_18px_48px_rgba(80,66,43,0.08)] backdrop-blur-md sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Link className="rounded-full border border-[#d9d4ca] bg-white px-4 py-2 text-[10px] uppercase tracking-[0.32em] text-[#726d62]" to="/">
                Perlin
              </Link>
              <div>
                <div className="text-[10px] uppercase tracking-[0.34em] text-[#8a8476]">Motorsport Journal</div>
                <div className="mt-1 text-lg uppercase tracking-[0.12em] text-[#464540]">Editorial Blog System</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <NavLink className={navClassName} to="/blog">
                Blog Index
              </NavLink>
              {isAuthenticated ? (
                <NavLink className={navClassName} to="/blog/new">
                  New Post
                </NavLink>
              ) : null}
              {isAuthenticated ? (
                <button
                  className="rounded-full border border-[#d8d2c8] bg-[#4f6550] px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-white transition hover:bg-[#445744]"
                  onClick={logout}
                  type="button"
                >
                  Logout {username ? `/ ${username}` : ""}
                </button>
              ) : (
                <button
                  className="rounded-full border border-[#d8d2c8] bg-[#fbfaf7] px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-[#6c685d] transition hover:bg-white"
                  onClick={() => openLoginModal()}
                  type="button"
                >
                  Login / 登录
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="mt-6 flex-1">{children}</div>
      </div>
    </main>
  );
}
