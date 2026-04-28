import { Suspense, lazy } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { AppButton } from "./components/AppButton";
import LoginModal from "./components/LoginModal";
import ProtectedRoute from "./components/ProtectedRoute";

const BlogEditorRoute = lazy(() => import("./routes/BlogEditorRoute"));
const BlogListRoute = lazy(() => import("./routes/BlogListRoute"));
const BlogPostRoute = lazy(() => import("./routes/BlogPostRoute"));
const HomepageBackground = lazy(() => import("./components/HomepageBackground"));
const LoadingOverlayLabRoute = lazy(() => import("./routes/LoadingOverlayLabRoute"));
const PerlinContoursRoute = lazy(() => import("./routes/PerlinContoursRoute"));
const ScanEffectRoute = lazy(() => import("./routes/ScanEffectRoute"));

function LazyRoute({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

function BlogEditorElement() {
  return (
    <LazyRoute>
      <ProtectedRoute>
        <BlogEditorRoute />
      </ProtectedRoute>
    </LazyRoute>
  );
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
          <AppButton component={Link} to="/blog" tone="darkOverlay">
            Open Blog
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
        <Route path="/blog" element={<LazyRoute><BlogListRoute /></LazyRoute>} />
        <Route path="/blog/new" element={<BlogEditorElement />} />
        <Route path="/blog/:slug" element={<LazyRoute><BlogPostRoute /></LazyRoute>} />
        <Route path="/blog/:slug/edit" element={<BlogEditorElement />} />
        <Route path="*" element={<Navigate to="/perlin-contours" replace />} />
      </Routes>
      <LoginModal />
    </>
  );
}
