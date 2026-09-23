"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArticleTransitionLink } from "./ExperienceChrome";

const Arrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
);

const POSTS_PER_PAGE = 10;

export default function BlogIndex({ posts }) {
  const [activeTag, setActiveTag] = useState("All");
  const [page, setPage] = useState(1);
  const postListRef = useRef(null);
  const tags = useMemo(() => ["All", ...Array.from(new Set(posts.flatMap((post) => post.tags))).sort()], [posts]);
  const filteredPosts = activeTag === "All" ? posts : posts.filter((post) => post.tags.includes(activeTag));
  const pageCount = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const visiblePosts = filteredPosts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    postListRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTag, page]);

  const selectTag = (tag) => {
    setActiveTag(tag);
    setPage(1);
  };

  return (
    <section className="blog-section" id="blog">
      <div className="section-heading reveal-up">
        <div>
          <p className="eyebrow"><span>02</span> SIGNAL ARCHIVE</p>
          <h2>笔记</h2>
        </div>
        <p className="section-intro"></p>
      </div>

      <div className="archive-layout">
        <aside className="tag-sidebar reveal-up" aria-label="Filter articles by tag">
          <p className="tag-sidebar-title">ALL TAGS</p>
          <div className="tag-sidebar-list">
            {tags.map((tag) => {
              const count = tag === "All" ? posts.length : posts.filter((post) => post.tags.includes(tag)).length;
              return (
                <button key={tag} className={`tag-filter ${activeTag === tag ? "is-active" : ""}`} onClick={() => selectTag(tag)} type="button" aria-pressed={activeTag === tag}>
                  <span>{tag}</span><small>{String(count).padStart(2, "0")}</small>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="archive-results">
          <div className="post-list" ref={postListRef} tabIndex={0} aria-label="Article index">
            {visiblePosts.map((post, index) => (
              <ArticleTransitionLink className="post-row reveal-up" href={`/blog/${post.slug}/`} key={post.slug} style={{ "--row-delay": `${index * 70}ms` }}>
                <span className="post-index">{String((page - 1) * POSTS_PER_PAGE + index + 1).padStart(2, "0")}</span>
                <div className="post-copy">
                  <div className="post-meta"><span>{post.date}</span><span>{post.readingTime}</span></div>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <div className="tag-list">{post.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                </div>
                <span className="post-arrow"><Arrow /></span>
              </ArticleTransitionLink>
            ))}
            {visiblePosts.length === 0 && <p className="empty-state">No transmissions found in this frequency.</p>}
          </div>

          <div className="pagination-row">
            <span>{String(filteredPosts.length).padStart(2, "0")} transmissions / {String(posts.length).padStart(2, "0")} total</span>
            <div className="pagination-controls">
              <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous page">Previous</button>
              <span>{page} / {pageCount}</span>
              <button onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} aria-label="Next page">Next</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
