"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link, useNavigate, useParams } from "@/lib/navigation";
import { AppButton } from "@/components/AppButton";
import BlogLayout from "@/components/BlogLayout";
import { createPost, getAdminPostBySlug, updatePost, uploadAsset } from "@/lib/api";
import { slugify } from "@/lib/blog";

const EMPTY_FORM = {
  content_markdown: "",
  cover_image_url: "",
  excerpt: "",
  slug: "",
  status: "draft",
  title: "",
};

export default function BlogEditorPage() {
  const { slug } = useParams();
  const isEditing = Boolean(slug);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingInline, setIsUploadingInline] = useState(false);
  const [postId, setPostId] = useState(null);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!isEditing)
      return;

    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        const post = await getAdminPostBySlug(slug);
        if (!isMounted)
          return;

        setPostId(post.id);
        setForm({
          content_markdown: post.content_markdown ?? "",
          cover_image_url: post.cover_image_url ?? "",
          excerpt: post.excerpt ?? "",
          slug: post.slug ?? "",
          status: post.status ?? "draft",
          title: post.title ?? "",
        });
        setSlugTouched(true);
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
  }, [isEditing, slug]);

  const previewTitle = useMemo(() => form.title || "Untitled Post", [form.title]);

  const updateField = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "title" && !slugTouched)
        next.slug = slugify(value);
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const payload = {
        ...form,
        excerpt: form.excerpt.trim(),
        slug: form.slug.trim(),
        title: form.title.trim(),
      };

      const saved = isEditing && postId
        ? await updatePost(postId, payload)
        : await createPost(payload);

      navigate(saved.status === "published" ? `/blog/${saved.slug}` : "/blog");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file)
      return;

    setIsUploadingCover(true);
    setError("");

    try {
      const upload = await uploadAsset(file);
      setForm((current) => ({ ...current, cover_image_url: upload.url }));
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploadingCover(false);
      event.target.value = "";
    }
  };

  const handleInlineUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file)
      return;

    setIsUploadingInline(true);
    setError("");

    try {
      const upload = await uploadAsset(file);
      setForm((current) => ({
        ...current,
        content_markdown: `${current.content_markdown}\n\n![${file.name}](${upload.url})\n`,
      }));
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploadingInline(false);
      event.target.value = "";
    }
  };

  return (
    <BlogLayout>
      {isLoading ? (
        <div className="rounded-[32px] border border-[#ddd7cc] bg-[#fbfaf6] px-6 py-16 text-sm text-[#736d61] shadow-[0_18px_48px_rgba(70,56,36,0.08)]">
          Loading editor...
        </div>
      ) : (
        <form className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_420px]" onSubmit={handleSubmit}>
          <section className="rounded-[34px] border border-[#ddd7cc] bg-[#fbfaf6] p-6 shadow-[0_18px_52px_rgba(74,59,39,0.08)] sm:p-8">
            <div className="flex flex-col gap-4 border-b border-[#e6e0d4] pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.34em] text-[#8c8577]">
                  {isEditing ? "Update Post" : "Create Post"}
                </div>
                <h1 className="mt-3 text-[clamp(2.2rem,5vw,4rem)] uppercase leading-[0.92] tracking-[0.08em] text-[#4b4a43]">
                  {isEditing ? "Edit Entry" : "New Entry"}
                </h1>
              </div>

              <div className="flex flex-wrap gap-3">
                <AppButton component={Link} sx={{ "&:hover": { bgcolor: "#ffffff", borderColor: "#d8d2c8", color: "#6b665c" } }} to="/blog" tone="ghost">
                  Cancel
                </AppButton>
                <AppButton
                  disabled={isSaving}
                  sx={{ "&.Mui-disabled": { bgcolor: "#94a091", borderColor: "#94a091", color: "#ffffff" } }}
                  tone="primary"
                  type="submit"
                >
                  {isSaving ? "Saving..." : isEditing ? "Update Post" : "Publish Draft"}
                </AppButton>
              </div>
            </div>

            {error ? <div className="mt-6 rounded-3xl bg-[#f4ddd6] px-5 py-4 text-sm text-[#834638]">{error}</div> : null}

            <div className="mt-6 grid gap-5">
              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.28em] text-[#787365]">Title / 鏍囬</span>
                <input
                  className="w-full rounded-2xl border border-[#d9d4ca] bg-white px-4 py-3 text-sm text-[#45453f] outline-none transition focus:border-[#8a9680]"
                  onChange={(event) => updateField("title", event.target.value)}
                  value={form.title}
                />
              </label>

              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_180px]">
                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-[0.28em] text-[#787365]">Slug / 璺緞鍚?/span>
                  <input
                    className="w-full rounded-2xl border border-[#d9d4ca] bg-white px-4 py-3 text-sm text-[#45453f] outline-none transition focus:border-[#8a9680]"
                    onChange={(event) => {
                      setSlugTouched(true);
                      updateField("slug", slugify(event.target.value));
                    }}
                    value={form.slug}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-[0.28em] text-[#787365]">Status / 鐘舵€?/span>
                  <select
                    className="w-full rounded-2xl border border-[#d9d4ca] bg-white px-4 py-3 text-sm text-[#45453f] outline-none transition focus:border-[#8a9680]"
                    onChange={(event) => updateField("status", event.target.value)}
                    value={form.status}
                  >
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.28em] text-[#787365]">Excerpt / 鎽樿</span>
                <textarea
                  className="min-h-[100px] w-full rounded-2xl border border-[#d9d4ca] bg-white px-4 py-3 text-sm leading-7 text-[#45453f] outline-none transition focus:border-[#8a9680]"
                  onChange={(event) => updateField("excerpt", event.target.value)}
                  value={form.excerpt}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.28em] text-[#787365]">Cover URL / 灏侀潰閾炬帴</span>
                <input
                  className="w-full rounded-2xl border border-[#d9d4ca] bg-white px-4 py-3 text-sm text-[#45453f] outline-none transition focus:border-[#8a9680]"
                  onChange={(event) => updateField("cover_image_url", event.target.value)}
                  value={form.cover_image_url}
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <AppButton
                  component="label"
                  sx={{ "&:hover": { bgcolor: "#f5f8f0", borderColor: "#d8d2c8", color: "#506651" } }}
                >
                  <input className="hidden" onChange={handleCoverUpload} type="file" />
                  {isUploadingCover ? "Uploading Cover..." : "Upload Cover"}
                </AppButton>
                <AppButton
                  component="label"
                  sx={{ "&:hover": { bgcolor: "#f5f8f0", borderColor: "#d8d2c8", color: "#506651" } }}
                >
                  <input className="hidden" onChange={handleInlineUpload} type="file" />
                  {isUploadingInline ? "Uploading Inline..." : "Insert Body Image"}
                </AppButton>
              </div>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.28em] text-[#787365]">Markdown / 姝ｆ枃</span>
                <textarea
                  className="min-h-[420px] w-full rounded-[24px] border border-[#d9d4ca] bg-white px-4 py-4 font-['Consolas','SFMono-Regular',monospace] text-sm leading-7 text-[#383833] outline-none transition focus:border-[#8a9680]"
                  onChange={(event) => updateField("content_markdown", event.target.value)}
                  value={form.content_markdown}
                />
              </label>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[30px] border border-[#ddd7cc] bg-[#fcfbf8] p-6 shadow-[0_18px_40px_rgba(73,58,36,0.06)]">
              <div className="text-[10px] uppercase tracking-[0.34em] text-[#8c8577]">Preview</div>
              <h2 className="mt-4 text-2xl uppercase leading-tight tracking-[0.08em] text-[#4b4a43]">{previewTitle}</h2>
              <p className="mt-4 text-sm leading-7 text-[#676255]">{form.excerpt || "Excerpt preview will appear here."}</p>
              {form.cover_image_url ? (
                <div className="mt-6 overflow-hidden rounded-[24px] border border-[#e5dfd4] bg-[#ece7dd]">
                  <img alt={previewTitle} className="h-full w-full object-cover" src={form.cover_image_url} />
                </div>
              ) : null}
            </section>

            <section className="rounded-[30px] border border-[#ddd7cc] bg-[#fbfaf6] p-6 shadow-[0_18px_40px_rgba(73,58,36,0.06)]">
              <div className="text-[10px] uppercase tracking-[0.34em] text-[#8c8577]">Markdown Preview</div>
              <div className="blog-prose mt-5 max-h-[620px] overflow-auto pr-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content_markdown || "_Nothing yet._"}</ReactMarkdown>
              </div>
            </section>
          </aside>
        </form>
      )}
    </BlogLayout>
  );
}
