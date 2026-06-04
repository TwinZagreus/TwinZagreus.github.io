import { Suspense, lazy } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { AppButton } from "../components/AppButton";

const HomepageBackground = lazy(() => import("../components/HomepageBackground"));
const LoadingOverlayLabRoute = lazy(() => import("../features/visual-labs/pages/LoadingOverlayLabPage"));
const PerlinContoursRoute = lazy(() => import("../features/visual-labs/pages/PerlinContoursPage"));
const ScanEffectRoute = lazy(() => import("../features/visual-labs/pages/ScanEffectPage"));

function LazyRoute({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

function HomeRouteElement() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-ink">
      <LazyRoute>
        <HomepageBackground />
      </LazyRoute>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-between px-5 py-5 text-[10px] uppercase tracking-[0.32em] text-white/45 sm:px-7">
        <span>Shader Background Lab</span>
        <div className="pointer-events-auto flex flex-wrap justify-end gap-3">
          <AppButton component={Link} to="/perlin-contours" tone="darkOverlay">
            Open Perlin Contours
          </AppButton>
          <AppButton component={Link} to="/scan-effect" tone="darkOverlay">
            Open Scan Effect
          </AppButton>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LazyRoute><PerlinContoursRoute /></LazyRoute>} />
        <Route path="/home" element={<HomeRouteElement />} />
        <Route path="/perlin-contours" element={<LazyRoute><PerlinContoursRoute /></LazyRoute>} />
        <Route path="/scan-effect" element={<LazyRoute><ScanEffectRoute /></LazyRoute>} />
        <Route path="/loading-overlay-lab" element={<LazyRoute><LoadingOverlayLabRoute /></LazyRoute>} />
        <Route path="*" element={<Navigate to="/perlin-contours" replace />} />
      </Routes>
    </>
  );
}
