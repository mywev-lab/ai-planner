/**
 * Minimal, dependency-free Markdown → HTML for briefing/chat text.
 * Supports headings (#, ##, ###), bold (**), italic (*), unordered lists,
 * paragraphs, markdown links [text](url), and bare http(s) URLs.
 * Escapes HTML first, so model output can't inject markup, and only allows
 * http/https/mailto hrefs (blocks javascript: and friends).
 */

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escapeAttr = (s: string) => escapeHtml(s).replace(/"/g, "&quot;");

const isSafeHref = (url: string) => /^(https?:\/\/|mailto:)/i.test(url.trim());

function anchor(href: string, text: string): string {
  return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
    text
  )}</a>`;
}

function inline(raw: string): string {
  const stash: string[] = [];
  // Token marker: passes through HTML-escaping unchanged and won't collide
  // with ordinary text (unlike a space+number marker, which would match
  // things like "2 horas").
  const keep = (html: string) => {
    stash.push(html);
    return `@@LNK${stash.length - 1}`;
  };

  let s = raw;

  // Markdown links: [text](url) — stashed as anchors before escaping.
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text, url) =>
    isSafeHref(url) ? keep(anchor(url, text)) : `${text} (${url})`
  );

  // Bare URLs.
  s = s.replace(/(https?:\/\/[^\s<>()]+)/g, (url) => keep(anchor(url, url)));

  // Escape whatever text remains.
  s = escapeHtml(s);

  // Emphasis.
  s = s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Restore stashed anchors.
  s = s.replace(/@@LNK(\d+)/g, (_m, i) => stash[Number(i)] ?? "");
  return s;
}

export function renderMarkdown(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      closeList();
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    const listItem = line.match(/^[-*]\s+(.*)$/);

    if (heading) {
      closeList();
      const level = Math.min(heading[1].length + 1, 4); // #→h2
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
    } else if (listItem) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(listItem[1])}</li>`);
    } else {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join("\n");
}
