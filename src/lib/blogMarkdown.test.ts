import { escapeHtmlText, renderMarkdownLinks } from './blogMarkdown';

describe('renderMarkdownLinks', () => {
  it('renders internal catalogue links as real anchors', () => {
    const result = renderMarkdownLinks(
      'See [Ubud ATV Ride](/experiences/vtr-001/ubud-atv-ride) for details.'
    );

    expect(result).toContain(
      '<a href="/experiences/vtr-001/ubud-atv-ride" class="font-semibold text-brand-ink underline decoration-brand decoration-2 underline-offset-2 hover:text-brand dark:text-brand">Ubud ATV Ride</a>'
    );
  });

  it('renders https links', () => {
    expect(renderMarkdownLinks('[Guide](https://example.com/guide)')).toContain(
      'href="https://example.com/guide"'
    );
  });

  it.each(['javascript:alert(1)', 'data:text/html,x', '//evil.example/x', 'http://example.com/x'])(
    'degrades unsafe href %s to plain text',
    (href) => {
      const result = renderMarkdownLinks(`[Click me](${href})`);
      expect(result).not.toContain('<a');
      expect(result).toBe('Click me');
    }
  );

  it('escapes HTML in the link label', () => {
    const result = renderMarkdownLinks('[<script>x</script>](/safe/path)');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;x&lt;/script&gt;');
  });

  it('leaves content without markdown links unchanged', () => {
    const content = 'A plain paragraph about Bali adventures.';
    expect(renderMarkdownLinks(content)).toBe(content);
  });
});

describe('escapeHtmlText', () => {
  it('escapes the five HTML-sensitive characters', () => {
    expect(escapeHtmlText(`& < > " '`)).toBe('&amp; &lt; &gt; &quot; &#39;');
  });
});
