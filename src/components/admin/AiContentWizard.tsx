'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface ArticleRow {
  id: string;
  slug: string;
  title: Record<string, string> | string;
  keywords: string[];
  tags: string[];
  publishedAt: string | null;
  aiGenerated: boolean;
  createdAt: string;
}

interface VentureOption {
  title: string;
  slug: string;
}

const CATEGORY_OPTIONS = [
  { value: 'ATV', label: 'ATV & Off-Road' },
  { value: 'Rafting', label: 'Rafting' },
  { value: 'Tubing', label: 'River Tubing' },
  { value: 'Cycling', label: 'Cycling' },
  { value: 'Trekking', label: 'Trekking & Hiking' },
  { value: 'Water Sports', label: 'Water Sports' },
  { value: 'Snorkeling', label: 'Snorkeling & Diving' },
  { value: 'Extreme', label: 'Extreme Adventures' },
  { value: 'Combo', label: 'Adventure Combo Packages' },
];

function readTitle(value: ArticleRow['title']): string {
  if (typeof value === 'string') return value;
  return value?.en ?? value?.id ?? '(untitled)';
}

export function AiContentWizard() {
  const [title, setTitle] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [category, setCategory] = useState('ATV');
  const [destination, setDestination] = useState('');
  const [ventureSlug, setVentureSlug] = useState('');
  const [language, setLanguage] = useState<'en' | 'id'>('en');
  const [publish, setPublish] = useState(false);

  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [ventures, setVentures] = useState<VentureOption[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadArticles = async () => {
    try {
      const response = await fetch('/api/admin/content');
      const payload = await response.json();
      if (payload.success) {
        setArticles(payload.data.articles as ArticleRow[]);
        setVentures(payload.data.ventures as VentureOption[]);
      }
    } catch {
      setError('Could not load the article list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadArticles();
  }, []);

  const handleGenerate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          primaryKeyword,
          category,
          destination: destination || undefined,
          ventureSlug: ventureSlug || undefined,
          language,
          publish,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setError(payload?.error?.message ?? 'The article could not be generated.');
        return;
      }

      setSuccess(
        `Saved "${payload.data.title}" as /blog/${payload.data.slug}${
          publish ? ' and published it' : ''
        }.`
      );
      setTitle('');
      setPrimaryKeyword('');
      await loadArticles();
    } catch {
      setError('The article could not be generated.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-gray-900">AI Content</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate long-tail SEO articles. Every article is validated against the title
          constitution and the 9-category taxonomy before it is stored.
        </p>
      </header>

      <form
        onSubmit={handleGenerate}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="lg:col-span-2">
            <label htmlFor="content-title" className="block text-sm font-medium text-gray-700 mb-1.5">
              Title (45-60 characters)
            </label>
            <input
              id="content-title"
              required
              minLength={45}
              maxLength={60}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ubud Jungle ATV Ride through Rice Terraces and Waterfalls"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-600"
            />
            <p className="text-xs text-gray-400 mt-1">{title.length} / 60 characters</p>
          </div>

          <div>
            <label htmlFor="content-keyword" className="block text-sm font-medium text-gray-700 mb-1.5">
              Primary keyword
            </label>
            <input
              id="content-keyword"
              required
              value={primaryKeyword}
              onChange={(event) => setPrimaryKeyword(event.target.value)}
              placeholder="Ubud ATV"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="content-category" className="block text-sm font-medium text-gray-700 mb-1.5">
              Category
            </label>
            <select
              id="content-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:border-blue-600"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="content-destination" className="block text-sm font-medium text-gray-700 mb-1.5">
              Destination (optional)
            </label>
            <input
              id="content-destination"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Ubud"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="content-venture" className="block text-sm font-medium text-gray-700 mb-1.5">
              Link to product (optional)
            </label>
            <select
              id="content-venture"
              value={ventureSlug}
              onChange={(event) => setVentureSlug(event.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:border-blue-600"
            >
              <option value="">No product link</option>
              {ventures.map((venture) => (
                <option key={venture.slug} value={venture.slug}>
                  {venture.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="content-language" className="block text-sm font-medium text-gray-700 mb-1.5">
              Language
            </label>
            <select
              id="content-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value as 'en' | 'id')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:border-blue-600"
            >
              <option value="en">English</option>
              <option value="id">Bahasa Indonesia</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-gray-700 pb-2.5">
              <input
                type="checkbox"
                checked={publish}
                onChange={(event) => setPublish(event.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              Publish immediately
            </label>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={isGenerating}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isGenerating ? 'Generating…' : 'Generate article'}
        </button>
      </form>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading text-lg font-semibold text-gray-900">Articles</h2>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-400 p-6 text-center">Loading…</p>
        ) : articles.length === 0 ? (
          <p className="text-sm text-gray-400 p-6 text-center">No articles yet.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {articles.map((article) => (
              <li key={article.id} className="px-5 py-3">
                <p className="font-medium text-gray-900 text-sm">{readTitle(article.title)}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">/blog/{article.slug}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {article.publishedAt ? (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                      Published
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Draft
                    </span>
                  )}
                  {article.aiGenerated && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      AI generated
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
