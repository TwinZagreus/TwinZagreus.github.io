import crypto from "node:crypto";
import { cookies } from "next/headers";
import { serverConfig } from "./config";

const SESSION_COOKIE = "motorsport_blog_session";

function sign(value) {
  return crypto.createHmac("sha256", serverConfig.appSecretKey).update(value).digest("hex");
}

function encodeSession(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(body);
  return `${body}.${signature}`;
}

function decodeSession(rawValue) {
  if (!rawValue) {
    return null;
  }

  const [body, signature] = rawValue.split(".");
  if (!body || !signature || sign(body) !== signature) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function validateCredentials(username, password) {
  return username === serverConfig.adminUsername && password === serverConfig.adminPassword;
}

export function getSessionState() {
  const cookieStore = cookies();
  const session = decodeSession(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session?.is_authenticated) {
    return { is_authenticated: false, username: null };
  }

  return {
    is_authenticated: true,
    username: session.username ?? serverConfig.adminUsername,
  };
}

export function requireAuth() {
  const session = getSessionState();
  if (!session.is_authenticated) {
    const error = new Error("Authentication required.");
    error.status = 401;
    throw error;
  }

  return session;
}

export function setAuthCookie(response) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: encodeSession({
      is_authenticated: true,
      username: serverConfig.adminUsername,
    }),
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
  });
}

export function clearAuthCookie(response) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    expires: new Date(0),
    path: "/",
    sameSite: "lax",
  });
}

