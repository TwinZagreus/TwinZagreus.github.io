"use client";

import { useMemo, useState } from "react";

const Arrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
);

export default function BlogIndex({ posts, compact = false }) {
  const [activeTag, setActiveTag] = useState("All");
  const [page, setPage] = useState(1);
  const pageSize = compact ? 3 : 5;
  const tags = useMemo(() => ["All", ...new Set(posts.flatMap((post) => post.tags))], [posts]);
  const filteredPosts = activeTag === "All" ? posts : posts.filter((post) => post.tags.includes(activeTag));
  const pageCount = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const visiblePosts = filteredPosts.slice((page - 1) * pageSize, page * pageSize);

  const selectTag = (tag) => {
    setActiveTag(tag);
    setPage(1);
  };

  return (
    <section className={`blog-section ${compact ? "blog-section--home" : "blog-section--archive"}`} id="blog">
      <div className="section-heading reveal-up">
        <div>
          <p className="eyebrow"><span>02</span> SIGNAL ARCHIVE</p>
          <h2>Notes from<br /><em>the orbit.</em></h2>
        </div>
        <p className="section-intro">Experiments, field notes, and quiet observations from the edge of the interface.</p>
      </div>

      <div className="filter-row reveal-up" aria-label="Filter articles by tag">
        {tags.map((tag) => (
          <button key={tag} className={`filter-chip ${activeTag === tag ? "is-active" : ""}`} onClick={() => selectTag(tag)} type="button">
            {tag}
          </button>
        ))}
      </div>

      <div className="post-list">
        {visiblePosts.map((post, index) => (
          <a className="post-row reveal-up" href={`/blog/${post.slug}/`} key={post.slug} style={{ "--row-delay": `${index * 70}ms` }}>
            <span className="post-index">0{(page - 1) * pageSize + index + 1}</span>
            <div className="post-copy">
              <div className="post-meta"><span>{post.date}</span><span>{post.readingTime}</span></div>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <div className="tag-list">{post.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            </div>
            <span className="post-arrow"><Arrow /></span>
          </a>
        ))}
        {visiblePosts.length === 0 && <p className="empty-state">No transmissions found in this frequency.</p>}
      </div>

      <div className="pagination-row">
        <span>{String(filteredPosts.length).padStart(2, "0")} transmissions / {String(posts.length).padStart(2, "0")} total</span>
        <div className="pagination-controls">
          <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous page">←</button>
          <span>{page} / {pageCount}</span>
          <button onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} aria-label="Next page">→</button>
        </div>
      </div>
    </section>
  );
}
