interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * Renders JSON-LD safely: `<` is escaped so a title or review can never close
 * the script tag. Use once per schema graph; multiple graphs can be passed as
 * an array and Google will merge them.
 */
export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
