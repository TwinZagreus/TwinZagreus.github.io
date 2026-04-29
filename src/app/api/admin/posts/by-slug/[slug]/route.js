import { requireAuth } from "../../../../../../lib/server/auth";
import { getAdminPostBySlug } from "../../../../../../lib/server/posts";
import { handleRouteError, json } from "../../../../../../lib/server/responses";

export async function GET(_, { params }) {
  try {
    requireAuth();
    return json(getAdminPostBySlug(params.slug));
  } catch (error) {
    return handleRouteError(error);
  }
}
