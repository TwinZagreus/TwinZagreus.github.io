import BlogIndex from "../../components/BlogIndex";
import SpaceCanvas from "../../components/SpaceCanvas";
import { getPosts } from "../../lib/posts";

export default function BlogPage() {
  return (
    <main className="subpage-shell">
      <SpaceCanvas mode="loading" />
      <div className="site-vignette" />
      <nav className="subpage-nav"><a href="/" className="brand-tag"><span className="brand-dot" /> AN / 01</a><a href="/">Back to orbit ↗</a></nav>
      <BlogIndex posts={getPosts()} />
    </main>
  );
}
