import BlogEditorRoute from "../../../routes/BlogEditorRoute";
import ProtectedRoute from "../../../components/ProtectedRoute";

export default function Page() {
  return (
    <ProtectedRoute>
      <BlogEditorRoute />
    </ProtectedRoute>
  );
}

