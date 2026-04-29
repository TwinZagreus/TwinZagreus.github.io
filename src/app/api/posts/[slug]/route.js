import { getPublicPostBySlug } from "../../../../lib/server/posts";
import { handleRouteError, json } from "../../../../lib/server/responses";

export async function GET(_, { params }) {
  try {
    return json(getPublicPostBySlug(params.slug));
  } catch (error) {
    return handleRouteError(error);
  }
}
