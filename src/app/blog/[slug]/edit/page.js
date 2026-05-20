import ProtectedRoute from "@/components/ProtectedRoute";
import BlogEditorPage from "@/features/blog/pages/BlogEditorPage";

export default function Page() {
  return (
    <ProtectedRoute>
      <BlogEditorPage />
    </ProtectedRoute>
  );
}
