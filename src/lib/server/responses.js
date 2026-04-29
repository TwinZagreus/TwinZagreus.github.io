import { NextResponse } from "next/server";

export function json(data, init = {}) {
  return NextResponse.json(data, init);
}

export function empty(status = 204) {
  return new NextResponse(null, { status });
}

export function handleRouteError(error) {
  return json({ detail: error.message || "Request failed." }, { status: error.status || 500 });
}

