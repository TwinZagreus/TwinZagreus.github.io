import { clearAuthCookie } from "../../../../lib/server/auth";
import { json } from "../../../../lib/server/responses";

export async function POST() {
  const response = json({ is_authenticated: false, username: null });
  clearAuthCookie(response);
  return response;
}
