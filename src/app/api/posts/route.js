import { listPublicPosts } from "../../../lib/server/posts";
import { handleRouteError, json } from "../../../lib/server/responses";

export async function GET() {
  try {
    return json(listPublicPosts());
  } catch (error) {
    return handleRouteError(error);
  }
}
