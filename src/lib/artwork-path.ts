// Shared between server and client code (no Node-only imports), since the
// browser needs to build the same pathname scheme the server parses.

export const PREFIX = "artworks/";
export const PENDING_STYLE = "pending";

export function encodePart(value: string) {
  return encodeURIComponent(value).replace(/__/g, "%5F%5F");
}

export function decodePart(value: string) {
  return decodeURIComponent(value);
}

export function buildPendingPathname(title: string, originalFilename: string) {
  const extension = originalFilename.split(".").pop() || "jpg";
  const uuid = crypto.randomUUID();
  return `${PREFIX}${encodePart(title || "Untitled")}__${PENDING_STYLE}__${uuid}.${extension}`;
}

export function parsePathname(pathname: string) {
  const base = pathname.slice(PREFIX.length);
  const [titleEnc, styleEnc] = base.split("__");
  return {
    title: titleEnc ? decodePart(titleEnc) : "Untitled",
    style: styleEnc ? decodePart(styleEnc) : "Uncategorized",
  };
}
