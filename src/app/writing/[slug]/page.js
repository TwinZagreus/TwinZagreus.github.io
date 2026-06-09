import { notFound } from "next/navigation";
import WritingArticlePage from "@/features/writing/WritingArticlePage";
import { getAllPosts, getPostBySlug } from "@/lib/posts";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    return {
      title: "Writing not found",
    };
  }

  return {
    description: post.excerpt,
    title: `${post.title} | TwinZ Field Notes`,
  };
}

export default function Page({ params }) {
  const allPosts = getAllPosts();
  const post = allPosts.find((item) => item.slug === params.slug) ?? null;

  if (!post) {
    notFound();
  }

  return <WritingArticlePage post={post} />;
}
