"use client";

import { AppButton } from "@/components/AppButton";
import HomepageBackground from "@/components/HomepageBackground";
import { Link } from "@/lib/navigation";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-ink">
      <HomepageBackground />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-between px-5 py-5 text-[10px] uppercase tracking-[0.32em] text-white/45 sm:px-7">
        <span>Shader Background Lab</span>
        <div className="pointer-events-auto flex flex-wrap justify-end gap-3">
          <AppButton component={Link} to="/perlin-contours" tone="darkOverlay">
            Open Perlin Contours
          </AppButton>
          <AppButton component={Link} to="/scan-effect" tone="darkOverlay">
            Open Scan Effect
          </AppButton>
          <AppButton component={Link} to="/blog" tone="darkOverlay">
            Open Blog
          </AppButton>
        </div>
      </div>
    </main>
  );
}
