import Link from "next/link";
import ArticleOutline from "../../../components/ArticleOutline";
import MarkdownBody from "../../../components/MarkdownBody";
import { HomeLink } from "../../../components/ExperienceChrome";
import { renderMarkdown } from "../../../lib/markdown";
import { getPostBySlug, getPosts } from "../../../lib/posts";

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export default async function PostPage({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) return <main className="not-found"><p>Transmission not found.</p><Link href="/#blog">Return to archive</Link></main>;

  const { html, headings } = await renderMarkdown(post.body);

  return (
    <main className="article-shell">
      <article className="article-page">
        <header className="article-header">
          <div className="article-meta"><span>{post.date}</span><span>{post.readingTime}</span><span>{post.tags.join(" / ")}</span></div>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
        </header>
        <ArticleOutline key={post.slug} headings={headings} />
        <MarkdownBody html={html} />
        <footer className="article-footer"><HomeLink href="/#blog" transition>← Return to archive</HomeLink><span>End of note / {String(getPosts().findIndex((item) => item.slug === post.slug) + 1).padStart(2, "0")}</span></footer>
      </article>
    </main>
  );
}
