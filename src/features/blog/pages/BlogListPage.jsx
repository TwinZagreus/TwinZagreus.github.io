"use client";

import { useEffect, useState } from "react";
import { Link } from "@/lib/navigation";
import { AppButton } from "@/components/AppButton";
import BlogLayout from "@/components/BlogLayout";
import { useProjectTheme } from "@/context/ProjectThemeContext";
import { listAdminPosts, listPublicPosts } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatPublishDate } from "@/lib/blog";

function PostCard({ post, showStatus }) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-[#ddd7cc] bg-[#fcfbf8] shadow-[0_18px_42px_rgba(73,58,36,0.08)]">
      {post.cover_image_url ? (
        <div className="aspect-[16/9] overflow-hidden border-b border-[#e6e0d5] bg-[#ebe6dc]">
          <img
            alt={post.title}
            className="h-full w-full object-cover"
            loading="lazy"
            src={post.cover_image_url}
          />
        </div>
      ) : (
        <div className="aspect-[16/9] border-b border-[#e6e0d5] bg-[linear-gradient(135deg,#f0ede5_0%,#e7e4db_100%)]" />
      )}

      <div className="p-6">
        <div className="flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.3em] text-[#8b8578]">
          <span>{formatPublishDate(post.published_at)}</span>
          {showStatus ? (
            <span
              className={[
                "rounded-full px-3 py-1",
                post.status === "published"
                  ? "bg-[#edf4e7] text-[#55704f]"
                  : "bg-[#ede8df] text-[#867c68]",
              ].join(" ")}
            >
              {post.status}
            </span>
          ) : null}
        </div>

        <h2 className="mt-4 text-2xl uppercase leading-tight tracking-[0.08em] text-[#4c4a44]">
          <Link className="transition hover:text-[#5f775b]" to={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </h2>
        <p className="mt-4 text-sm leading-7 text-[#666255]">{post.excerpt || "No excerpt yet."}</p>

        <div className="mt-6 flex items-center justify-between gap-4">
          <AppButton component={Link} to={`/blog/${post.slug}`}>
            Read Post
          </AppButton>
          {showStatus ? (
            <AppButton
              component={Link}
              sx={{ "&:hover": { bgcolor: "#ffffff", borderColor: "#d8d2c8", color: "#666255" } }}
              to={`/blog/${post.slug}/edit`}
              tone="ghost"
            >
              Edit
            </AppButton>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function BlogListPage() {
  const { isAuthenticated } = useAuth();
  const { colorMap } = useProjectTheme();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        const nextPosts = isAuthenticated ? await listAdminPosts() : await listPublicPosts();
        if (isMounted)
          setPosts(nextPosts);
      } catch (loadError) {
        if (isMounted)
          setError(loadError.message);
      } finally {
        if (isMounted)
          setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  return (
    <BlogLayout>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_320px]">
        <div className="rounded-[34px] border border-[#ddd7cc] bg-[#fbfaf6] p-6 shadow-[0_18px_52px_rgba(74,59,39,0.08)] sm:p-8">
          <div className="flex flex-col gap-4 border-b border-[#e6e0d4] pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.34em] text-[#8c8577]">Publishing Surface</div>
              <h1 className="mt-3 text-[clamp(2.4rem,6vw,4.8rem)] uppercase leading-[0.9] tracking-[0.08em] text-[#4b4a43]">
                Blog
                <br />
                Index
              </h1>
            </div>
            <p className="max-w-md text-sm leading-7 text-[#696456]">
              Browse public posts, then sign in to unlock the editor workflow for drafts, covers, Markdown content, and publishing controls.
            </p>
          </div>

          {error ? <div className="mt-6 rounded-3xl bg-[#f4ddd6] px-5 py-4 text-sm text-[#834638]">{error}</div> : null}

          {isLoading ? (
            <div className="mt-8 rounded-[28px] border border-dashed border-[#ddd7cc] px-6 py-12 text-sm text-[#7b7569]">
              Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <div className="mt-8 rounded-[28px] border border-dashed border-[#ddd7cc] px-6 py-12 text-sm text-[#7b7569]">
              No posts yet.
            </div>
          ) : (
            <div className="mt-8 grid gap-6 xl:grid-cols-2">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} showStatus={isAuthenticated} />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-[30px] border border-[#ddd7cc] bg-[#fcfbf8] p-6 shadow-[0_18px_40px_rgba(73,58,36,0.06)]">
            <div className="text-[10px] uppercase tracking-[0.34em] text-[#8c8577]">System Notes</div>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[#676255]">
              <p>Posts are served by Next.js Route Handlers with SQLite storage.</p>
              <p>Anonymous visitors can read published entries. After login, editor controls appear in place.</p>
            </div>
          </section>

          <section className="rounded-[30px] border border-[#ddd7cc] p-6 text-white shadow-[0_22px_40px_rgba(62,74,58,0.22)]" style={{ backgroundColor: colorMap.coral }}>
            <div className="text-[10px] uppercase tracking-[0.34em] text-white/65">Current Mode</div>
            <div className="mt-4 text-2xl uppercase tracking-[0.08em]">
              {isAuthenticated ? "Editor" : "Reader"}
            </div>
            <p className="mt-4 text-sm leading-7 text-white/78">
              {isAuthenticated
                ? "Editor mode is active. You can create, edit, delete, and manage post status."
                : "Reader mode is active. Published posts are visible, while editing tools stay locked."}
            </p>
          </section>
        </aside>
      </section>
    </BlogLayout>
  );
}
