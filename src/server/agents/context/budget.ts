/** Keeps the head and tail of long text (where errors and summaries usually are). */
export function truncateMiddle(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const keep = Math.max(0, maxChars - 40);
  const head = Math.ceil(keep * 0.4);
  const tail = keep - head;
  return `${text.slice(0, head)}\n…[${text.length - keep} chars omitted]…\n${text.slice(text.length - tail)}`;
}

/** Keeps the end of command output, where failures are reported. */
export function tail(text: string, maxChars: number): string {
  return text.length <= maxChars ? text : `…[${text.length - maxChars} chars omitted]…\n${text.slice(-maxChars)}`;
}

/**
 * Renders titled sections within a total character budget, giving each
 * section at most its share and dropping the lowest-priority ones first.
 */
export function renderSections(sections: Array<{ title: string; body: string; priority: number }>, budget: number): string {
  const ordered = [...sections].filter((section) => section.body.trim()).sort((a, b) => b.priority - a.priority);
  const parts: string[] = [];
  let remaining = budget;
  for (const [index, section] of ordered.entries()) {
    if (remaining < 200) break;
    const share = Math.floor(remaining / (ordered.length - index));
    const body = truncateMiddle(section.body.trim(), Math.max(200, share - section.title.length - 8));
    parts.push(`## ${section.title}\n${body}`);
    remaining -= body.length + section.title.length + 8;
  }
  return parts.join("\n\n");
}
