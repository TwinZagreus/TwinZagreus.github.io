"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useProjectTheme } from "../context/ProjectThemeContext";
import { useLocation, useNavigate } from "../lib/navigation";
import { AppButton } from "./AppButton";

export default function LoginModal() {
  const {
    closeLoginModal,
    consumePendingRedirect,
    isCheckingSession,
    login,
    loginModalOpen,
  } = useAuth();
  const { colorMap } = useProjectTheme();
  const [form, setForm] = useState({ password: "", username: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!loginModalOpen)
    return null;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(form);
      const redirectTarget = consumePendingRedirect();
      navigate(redirectTarget ?? location.pathname, { replace: Boolean(redirectTarget) });
      setForm({ password: "", username: "" });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#161712]/35 px-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-[28px] border bg-[#fbfaf6] p-6 text-[#4b4a43] shadow-[0_24px_80px_rgba(53,43,29,0.2)]"
        style={{ borderColor: colorMap.coral400 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.34em]" style={{ color: colorMap.neutral900 }}>Administrator</div>
            <h2 className="mt-3 text-3xl uppercase tracking-[0.08em]" style={{ color: colorMap.ink800 }}>Blog Login</h2>
            <p className="mt-2 text-sm leading-6 text-[#6d685c]">
              登录后才能新建、编辑、删除博客。未登录状态默认只读。
            </p>
          </div>
          <AppButton onClick={closeLoginModal} sx={{ px: 1.5, py: 0.5, letterSpacing: "0.3em" }} type="button">
            Close
          </AppButton>
        </div>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.28em]" style={{ color: colorMap.neutral900 }}>Username / 用户名</span>
            <input
              autoComplete="username"
              className="w-full rounded-2xl border bg-white px-4 py-3 text-sm text-[#45453f] outline-none transition"
              disabled={isSubmitting || isCheckingSession}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              style={{ borderColor: colorMap.coral300 }}
              value={form.username}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.28em]" style={{ color: colorMap.neutral900 }}>Password / 密码</span>
            <input
              autoComplete="current-password"
              className="w-full rounded-2xl border bg-white px-4 py-3 text-sm text-[#45453f] outline-none transition"
              disabled={isSubmitting || isCheckingSession}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              style={{ borderColor: colorMap.coral300 }}
              type="password"
              value={form.password}
            />
          </label>

          {error ? <div className="rounded-2xl bg-[#f2d8d1] px-4 py-3 text-sm text-[#7a3d31]">{error}</div> : null}

          <AppButton
            disabled={isSubmitting || isCheckingSession}
            fullWidth
            sx={{
              "&.Mui-disabled": { bgcolor: colorMap.neutral300, borderColor: colorMap.neutral300, color: "#ffffff" },
              "&:hover": { bgcolor: colorMap.ink700, borderColor: colorMap.ink700 },
              bgcolor: colorMap.coral,
              borderColor: colorMap.coral,
              borderRadius: "16px",
              color: "#ffffff",
              fontSize: "11px",
              py: 1.5,
            }}
            type="submit"
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </AppButton>
        </form>
      </div>
    </div>
  );
}
