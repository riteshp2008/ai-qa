/** Only same-origin, path-only redirect targets are allowed (blocks open redirects). */
export function safeRedirectPath(value: unknown, fallback = "/dashboard") {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
    ? value
    : fallback;
}
