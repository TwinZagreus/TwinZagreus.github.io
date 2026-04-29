import { requireAuth } from "../../../../lib/server/auth";
import { createPost, listAdminPosts } from "../../../../lib/server/posts";
import { handleRouteError, json } from "../../../../lib/server/responses";

export async function GET() {
  try {
    requireAuth();
    return json(listAdminPosts());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request) {
  try {
    requireAuth();
    return json(createPost(await request.json()));
  } catch (error) {
    return handleRouteError(error);
  }
}
