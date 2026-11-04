import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const ALLOWED = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'blockquote', 'hr', 'code', 'pre', 'img',
  ],
  allowedAttributes: { a: ['href', 'title'], img: ['src', 'alt', 'width'] },
  allowedSchemes: ['https', 'http', 'mailto'],
};

/** Markdown to sanitized HTML for broadcasts, site messages and support replies. */
export function markdownToHtml(md: string): string {
  const raw = marked.parse(String(md || ''), { async: false, gfm: true, breaks: true }) as string;
  return sanitizeHtml(raw, ALLOWED);
}

/** Inline email styles; mail clients ignore stylesheets. */
export function markdownToEmailHtml(md: string): string {
  return markdownToHtml(md)
    .replace(/<a /g, '<a style="color:#1e4a37;" ')
    .replace(/<h2>/g, '<h2 style="font:700 22px/1.25 Helvetica,Arial,sans-serif;margin:24px 0 8px;">')
    .replace(/<h3>/g, '<h3 style="font:700 18px/1.3 Helvetica,Arial,sans-serif;margin:20px 0 6px;">')
    .replace(/<blockquote>/g, '<blockquote style="margin:16px 0;padding:8px 16px;background:#e6dfd0;border-radius:4px;">')
    .replace(/<img /g, '<img style="max-width:100%;height:auto;border-radius:12px;" ');
}

export function markdownToText(md: string): string {
  return String(md || '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/[*_`#>]/g, '')
    .trim();
}
