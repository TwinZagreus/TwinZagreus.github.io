import BlogEditorPage from "@/features/blog/pages/BlogEditorPage";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Page() {
  return (
    <ProtectedRoute>
      <BlogEditorPage />
    </ProtectedRoute>
  );
}
