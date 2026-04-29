import { serverConfig } from "../../../../lib/server/config";
import { setAuthCookie, validateCredentials } from "../../../../lib/server/auth";
import { handleRouteError, json } from "../../../../lib/server/responses";

export async function POST(request) {
  try {
    const payload = await request.json();
    if (!validateCredentials(payload?.username, payload?.password)) {
      return json({ detail: "Invalid username or password." }, { status: 401 });
    }

    const response = json({
      is_authenticated: true,
      username: serverConfig.adminUsername,
    });

    setAuthCookie(response);
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
