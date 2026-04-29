import { getSessionState } from "../../../../lib/server/auth";
import { json } from "../../../../lib/server/responses";

export async function GET() {
  const session = getSessionState();

  return json({
    is_authenticated: session.is_authenticated,
    username: session.username,
  });
}
