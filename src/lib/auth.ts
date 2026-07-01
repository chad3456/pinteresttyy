export const AUTH_COOKIE = "gallery_auth";

export function isValidPassword(candidate: string) {
  const expected = process.env.GALLERY_PASSWORD;
  if (!expected) return false;
  return candidate === expected;
}

export function isValidSession(cookieValue: string | undefined) {
  if (!cookieValue) return false;
  return cookieValue === process.env.GALLERY_PASSWORD;
}
