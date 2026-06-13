import dynamic from "next/dynamic";
import { getAllPosts } from "@/lib/posts";

const PerlinContoursPage = dynamic(() => import("@/features/visual-labs/pages/PerlinContoursPage"), { ssr: false });

export default function Page() {
  const posts = getAllPosts();

  return <PerlinContoursPage posts={posts} />;
}
