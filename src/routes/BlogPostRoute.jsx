import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppButton } from "../components/AppButton";
import BlogLayout from "../components/BlogLayout";
import { useAuth } from "../context/AuthContext";
import { deletePost, getAdminPostBySlug, getPublicPost } from "../lib/api";
import { formatPublishDate } from "../lib/blog";

export default function BlogPostRoute() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [post, setPost] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        let nextPost;

        if (isAuthenticated) {
          try {
            nextPost = await getAdminPostBySlug(slug);
          } catch {
            nextPost = await getPublicPost(slug);
          }
        } else {
          nextPost = await getPublicPost(slug);
        }

        if (isMounted)
          setPost(nextPost);
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
  }, [isAuthenticated, slug]);

  const handleDelete = async () => {
    if (!post)
      return;
    if (!window.confirm(`Delete "${post.title}"?`))
      return;

    setIsDeleting(true);
    try {
      await deletePost(post.id);
      navigate("/blog");
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BlogLayout>
      {isLoading ? (
        <div className="rounded-[32px] border border-[#ddd7cc] bg-[#fbfaf6] px-6 py-16 text-sm text-[#736d61] shadow-[0_18px_48px_rgba(70,56,36,0.08)]">
          Loading article...
        </div>
      ) : error ? (
        <div className="rounded-[32px] bg-[#f4ddd6] px-6 py-5 text-sm text-[#834638]">{error}</div>
      ) : !post ? (
        <div className="rounded-[32px] border border-[#ddd7cc] bg-[#fbfaf6] px-6 py-16 text-sm text-[#736d61]">
          Post not found.
        </div>
      ) : (
        <article className="rounded-[34px] border border-[#ddd7cc] bg-[#fbfaf6] shadow-[0_18px_52px_rgba(74,59,39,0.08)]">
          {post.cover_image_url ? (
            <div className="aspect-[16/8] overflow-hidden rounded-t-[34px] border-b border-[#e4dfd5] bg-[#e9e3d8]">
              <img alt={post.title} className="h-full w-full object-cover" src={post.cover_image_url} />
            </div>
          ) : null}

          <div className="mx-auto max-w-4xl px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
            <div className="flex flex-wrap items-center justify-between gap-4 text-[10px] uppercase tracking-[0.3em] text-[#8b8577]">
              <div className="flex flex-wrap items-center gap-3">
                <span>{formatPublishDate(post.published_at)}</span>
                <span className="rounded-full bg-[#ede8df] px-3 py-1 text-[#7a7363]">{post.status}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <AppButton component={Link} sx={{ "&:hover": { bgcolor: "#ffffff", borderColor: "#d8d2c8", color: "#6a665d" } }} to="/blog" tone="ghost">
                  Back
                </AppButton>
                {isAuthenticated ? (
                  <>
                    <AppButton component={Link} to={`/blog/${post.slug}/edit`}>
                      Edit
                    </AppButton>
                    <AppButton
                      disabled={isDeleting}
                      onClick={handleDelete}
                      sx={{ "&.Mui-disabled": { opacity: 0.6, color: "#ffffff" } }}
                      tone="danger"
                      type="button"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AppButton>
                  </>
                ) : null}
              </div>
            </div>

            <h1 className="mt-8 text-[clamp(2.4rem,6vw,5rem)] uppercase leading-[0.92] tracking-[0.08em] text-[#484741]">
              {post.title}
            </h1>

            {post.excerpt ? <p className="mt-6 max-w-3xl text-lg leading-8 text-[#666255]">{post.excerpt}</p> : null}

            <div className="blog-prose mt-10">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content_markdown}</ReactMarkdown>
            </div>
          </div>
        </article>
      )}
    </BlogLayout>
  );
}
