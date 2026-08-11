import Link from "next/link";
import MarkdownRenderer from "../../../components/MarkdownRenderer";
import { HomeLink } from "../../../components/ExperienceChrome";
import { getPostBySlug, getPosts } from "../../../lib/posts";

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export default function PostPage({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) return <main className="not-found"><p>Transmission not found.</p><Link href="/#blog">Return to archive</Link></main>;

  return (
    <main className="article-shell">
      <article className="article-page">
        <header className="article-header">
          <div className="article-meta"><span>{post.date}</span><span>{post.readingTime}</span><span>{post.tags.join(" / ")}</span></div>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
        </header>
        <MarkdownRenderer content={post.body} />
        <footer className="article-footer"><HomeLink href="/#blog">← Return to archive</HomeLink><span>End of note / {String(getPosts().findIndex((item) => item.slug === post.slug) + 1).padStart(2, "0")}</span></footer>
      </article>
    </main>
  );
}
