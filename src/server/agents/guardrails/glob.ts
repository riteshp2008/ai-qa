/**
 * Minimal glob → RegExp for repository-relative paths.
 * Supports `**` (any depth, including none), `*` (within a segment), `?`, and `{a,b}`.
 */
export function globToRegExp(glob: string): RegExp {
  let pattern = "";
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i];
    if (char === "*") {
      if (glob[i + 1] === "*") {
        const followedBySlash = glob[i + 2] === "/";
        pattern += followedBySlash ? "(?:.*/)?" : ".*";
        i += followedBySlash ? 2 : 1;
      } else {
        pattern += "[^/]*";
      }
    } else if (char === "?") {
      pattern += "[^/]";
    } else if (char === "{") {
      const end = glob.indexOf("}", i);
      const options = glob.slice(i + 1, end).split(",").map((option) => option.replace(/[.+^$()|[\]\\]/g, "\\$&"));
      pattern += `(?:${options.join("|")})`;
      i = end;
    } else {
      pattern += char.replace(/[.+^$()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${pattern}$`);
}

export function matchesAny(path: string, globs: readonly string[]) {
  return globs.some((glob) => globToRegExp(glob).test(path));
}
