/**
 * Small, dependency-free markdown helpers for generated blog articles.
 *
 * `addInternalLinks()` inserts `[title](/experiences/id/slug)` markers into AI
 * generated article content. The blog renderer must turn those markers into
 * real anchors — otherwise every generated article loses its internal links.
 *
 * Security: only same-origin absolute paths and https:// URLs are rendered as
 * links. Anything else (javascript:, data:, protocol-relative //host, ...) is
 * degraded to plain text so generated content cannot inject an active URL.
 */

const SAFE_HREF = /^(?:\/(?!\/)|https:\/\/)/i;

export function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderMarkdownLinks(content: string): string {
  return content.replace(
    // Allow one level of parentheses in the URL (e.g. javascript:alert(1))
    // so the whole marker is consumed and can be degraded to plain text.
    /\[([^\]\n]+)\]\(((?:[^()]|\([^()]*\))+)\)/g,
    (_match: string, label: string, href: string): string => {
      const safeLabel = escapeHtmlText(label);
      if (!SAFE_HREF.test(href)) return safeLabel;
      return `<a href="${escapeHtmlText(href)}" class="font-semibold text-brand-ink underline decoration-brand decoration-2 underline-offset-2 hover:text-brand dark:text-brand">${safeLabel}</a>`;
    }
  );
}
