"use client";

import { useMemo, useState } from "react";
import { Link } from "../lib/navigation";
import { AppButton } from "../components/AppButton";
import ThreeLoadingOverlay, { LOADING_OVERLAY_CONFIG } from "../components/ThreeLoadingOverlay";

const DEFAULT_LAB_CONFIG = {
  backgroundColor: LOADING_OVERLAY_CONFIG.backgroundColor,
  logoGap: LOADING_OVERLAY_CONFIG.logoGap,
  twinLogoSize: LOADING_OVERLAY_CONFIG.twinLogoSize,
  zLogoSize: LOADING_OVERLAY_CONFIG.zLogoSize,
};

function RangeControl({ label, min, max, step, value, onChange }) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.24em] text-[#706c63]">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input
        className="h-2 w-full accent-[#5f7f64]"
        max={max}
        min={min}
        onInput={(event) => onChange(Number(event.currentTarget.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}

export default function LoadingOverlayLabRoute() {
  const [labConfig, setLabConfig] = useState(DEFAULT_LAB_CONFIG);

  const overlayConfig = useMemo(
    () => ({
      ...LOADING_OVERLAY_CONFIG,
      ...labConfig,
      sliceFallDistance: Math.round(Math.max(window.innerHeight * 1.18, 960)),
    }),
    [labConfig],
  );

  const update = (key, value) => {
    setLabConfig((current) => ({ ...current, [key]: value }));
  };

  const reset = () => {
    setLabConfig(DEFAULT_LAB_CONFIG);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#eef3f8]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,107,255,0.14),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#edf3fa_100%)]" />

      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="flex h-full items-end justify-center pb-16">
          <div className="max-w-3xl px-6 text-center text-[#4b5563]">
            <div className="text-[10px] uppercase tracking-[0.34em] text-[#7e8a99]">Loading Overlay Lab</div>
            <h1 className="mt-5 text-[clamp(2.8rem,6vw,5.4rem)] uppercase leading-[0.9] tracking-[0.06em] text-[#18212c]">
              Tune The
              <br />
              TwinZ Mark
            </h1>
            <p className="mt-5 text-sm leading-7 text-[#5f6874]">
              这个路由会一直保持 Loading 初始态，不触发退出。你可以在右侧实时调 `Twin`、`Z`
              的字号和两者间距。
            </p>
          </div>
        </div>
      </div>

      <ThreeLoadingOverlay config={overlayConfig} isReady={false} />

      <div className="absolute right-4 top-4 z-[80] sm:right-6 sm:top-6">
        <section className="w-[min(340px,calc(100vw-2rem))] rounded-[26px] border border-[#d8dde3] bg-white/88 p-4 text-[#4c4f55] shadow-[0_18px_48px_rgba(29,48,84,0.12)] backdrop-blur-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.34em] text-[#7d8793]">Static Loading Preview</div>
              <div className="mt-2 text-sm leading-6 text-[#6a7380]">
                调整大小和间距，确认初始构图。这个页面不会自动播放退出动画。
              </div>
            </div>
            <AppButton
              onClick={reset}
              sx={{ px: 1.5, py: 0.5, color: "#68717d", borderColor: "#d6dbe1", "&:hover": { bgcolor: "#ffffff", borderColor: "#d6dbe1", color: "#68717d" } }}
              type="button"
            >
              Reset
            </AppButton>
          </div>

          <div className="mt-5 space-y-4">
            <RangeControl
              label="Twin Size"
              max="180"
              min="56"
              onChange={(value) => update("twinLogoSize", value)}
              step="1"
              value={labConfig.twinLogoSize}
            />
            <RangeControl
              label="Z Size"
              max="180"
              min="56"
              onChange={(value) => update("zLogoSize", value)}
              step="1"
              value={labConfig.zLogoSize}
            />
            <RangeControl
              label="Gap"
              max="40"
              min="-12"
              onChange={(value) => update("logoGap", value)}
              step="1"
              value={labConfig.logoGap}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <AppButton component={Link} sx={{ borderColor: "#d6dbe1", color: "#616975", "&:hover": { bgcolor: "#f7fafc", borderColor: "#d6dbe1", color: "#616975" } }} to="/">
              Back Home
            </AppButton>
            <AppButton component={Link} sx={{ borderColor: "#d6dbe1", color: "#616975", "&:hover": { bgcolor: "#f7fafc", borderColor: "#d6dbe1", color: "#616975" } }} to="/perlin-contours">
              Perlin Route
            </AppButton>
          </div>
        </section>
      </div>
    </main>
  );
}
