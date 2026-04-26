import { Suspense, lazy } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import LoginModal from "./components/LoginModal";
import ProtectedRoute from "./components/ProtectedRoute";

const BlogEditorRoute = lazy(() => import("./routes/BlogEditorRoute"));
const BlogListRoute = lazy(() => import("./routes/BlogListRoute"));
const BlogPostRoute = lazy(() => import("./routes/BlogPostRoute"));
const HomepageBackground = lazy(() => import("./components/HomepageBackground"));
const PerlinContoursRoute = lazy(() => import("./routes/PerlinContoursRoute"));
const ScanEffectRoute = lazy(() => import("./routes/ScanEffectRoute"));

export default function App() {
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={null}>
              <PerlinContoursRoute />
            </Suspense>
          }
        />
        <Route
          path="/home"
          element={
            <main className="relative min-h-screen overflow-hidden bg-ink">
              <Suspense fallback={null}>
                <HomepageBackground />
              </Suspense>

              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-between px-5 py-5 text-[10px] uppercase tracking-[0.32em] text-white/45 sm:px-7">
                <span>Shader Background Lab</span>
                <div className="pointer-events-auto flex flex-wrap justify-end gap-3">
                  <Link
                    className="rounded-full border border-white/10 bg-black/10 px-4 py-2 text-white/70 transition duration-200 ease-out hover:bg-white/10 hover:text-white"
                    to="/perlin-contours"
                  >
                    Open Perlin Contours
                  </Link>
                  <Link
                    className="rounded-full border border-white/10 bg-black/10 px-4 py-2 text-white/70 transition duration-200 ease-out hover:bg-white/10 hover:text-white"
                    to="/scan-effect"
                  >
                    Open Scan Effect
                  </Link>
                  <Link
                    className="rounded-full border border-white/10 bg-black/10 px-4 py-2 text-white/70 transition duration-200 ease-out hover:bg-white/10 hover:text-white"
                    to="/blog"
                  >
                    Open Blog
                  </Link>
                </div>
              </div>
            </main>
          }
        />
        <Route
          path="/perlin-contours"
          element={
            <Suspense fallback={null}>
              <PerlinContoursRoute />
            </Suspense>
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
        <Route
          path="/blog"
          element={
            <Suspense fallback={null}>
              <BlogListRoute />
            </Suspense>
          }
        />
        <Route
          path="/blog/new"
          element={
            <Suspense fallback={null}>
              <ProtectedRoute>
                <BlogEditorRoute />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/blog/:slug"
          element={
            <Suspense fallback={null}>
              <BlogPostRoute />
            </Suspense>
          }
        />
        <Route
          path="/blog/:slug/edit"
          element={
            <Suspense fallback={null}>
              <ProtectedRoute>
                <BlogEditorRoute />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/perlin-contours" replace />} />
      </Routes>
      <LoginModal />
    </>
  );
}
