import { Suspense, lazy } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";

const HomepageBackground = lazy(() => import("./components/HomepageBackground"));
const ScanEffectRoute = lazy(() => import("./routes/ScanEffectRoute"));

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <main className="relative min-h-screen overflow-hidden bg-ink">
            <Suspense fallback={null}>
              <HomepageBackground />
            </Suspense>

            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-between px-5 py-5 text-[10px] uppercase tracking-[0.32em] text-white/45 sm:px-7">
              <span>Shader Background Lab</span>
              <div className="pointer-events-auto">
                <Link
                  className="rounded-full border border-white/10 bg-black/10 px-4 py-2 text-white/70 transition duration-200 ease-out hover:bg-white/10 hover:text-white"
                  to="/scan-effect"
                >
                  Open Scan Effect
                </Link>
              </div>
            </div>
          </main>
        }
      />
      <Route
        path="/scan-effect"
        element={
          <Suspense fallback={null}>
            <ScanEffectRoute />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
