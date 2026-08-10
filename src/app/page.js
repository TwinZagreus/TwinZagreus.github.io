import AstralHome from "../components/AstralHome";
import { getPosts } from "../lib/posts";

export default function Page() {
  return <AstralHome posts={getPosts()} />;
}
