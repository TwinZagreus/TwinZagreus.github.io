import ProtectedRoute from "../../../../components/ProtectedRoute";
import BlogEditorRoute from "../../../../routes/BlogEditorRoute";

export default function Page() {
  return (
    <ProtectedRoute>
      <BlogEditorRoute />
    </ProtectedRoute>
  );
}

