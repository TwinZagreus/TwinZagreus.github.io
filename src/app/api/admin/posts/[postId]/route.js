import { requireAuth } from "../../../../../lib/server/auth";
import { deletePost, getAdminPostById, updatePost } from "../../../../../lib/server/posts";
import { empty, handleRouteError, json } from "../../../../../lib/server/responses";

export async function GET(_, { params }) {
  try {
    requireAuth();
    return json(getAdminPostById(Number(params.postId)));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request, { params }) {
  try {
    requireAuth();
    return json(updatePost(Number(params.postId), await request.json()));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_, { params }) {
  try {
    requireAuth();
    deletePost(Number(params.postId));
    return empty(204);
  } catch (error) {
    return handleRouteError(error);
  }
}
