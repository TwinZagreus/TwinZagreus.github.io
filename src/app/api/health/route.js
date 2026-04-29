import { json } from "../../../lib/server/responses";

export async function GET() {
  return json({ status: "ok" });
}
