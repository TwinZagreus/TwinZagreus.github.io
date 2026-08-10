import Link from "next/link";
import MarkdownRenderer from "../../../components/MarkdownRenderer";
import SpaceCanvas from "../../../components/SpaceCanvas";
import { getPostBySlug, getPosts } from "../../../lib/posts";

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export default function PostPage({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) return <main className="not-found"><p>Transmission not found.</p><Link href="/blog/">Return to archive</Link></main>;

  return (
    <main className="article-shell">
      <SpaceCanvas mode="loading" />
      <div className="site-vignette" />
      <nav className="subpage-nav"><Link href="/blog/" className="brand-tag"><span className="brand-dot" /> AN / 01</Link><Link href="/blog/">Back to archive <span>←</span></Link></nav>
      <article className="article-page">
        <header className="article-header">
          <div className="article-meta"><span>{post.date}</span><span>{post.readingTime}</span><span>{post.tags.join(" / ")}</span></div>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
        </header>
        <MarkdownRenderer content={post.body} />
        <footer className="article-footer"><Link href="/blog/">← All transmissions</Link><span>End of note / 0{getPosts().findIndex((item) => item.slug === post.slug) + 1}</span></footer>
      </article>
    </main>
  );
}
