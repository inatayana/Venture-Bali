'use client';

import { useState, useEffect } from 'react';
import { Search, Link as LinkIcon, Globe, ShieldCheck, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuditData {
  score: number;
  issues: { type: string; message: string; target: string }[];
  suggestions: string[];
}

interface Keyword {
  keyword: string;
  difficulty: string;
  potential: number;
  reason: string;
}

interface BacklinkData {
  targetSites: { url: string; niche: string; method: string }[];
  outreachTemplates: { subject: string; body: string }[];
}

export function SeoExpertAgent() {
  const [activeTab, setActiveTab] = useState<'audit' | 'keywords' | 'backlinks' | 'indexing'>('audit');
  const [isLoading, setIsLoading] = useState(false);
const [audit, setAudit] = useState<AuditData | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [backlinks, setBacklinks] = useState<BacklinkData | null>(null);
  const [indexUrl, setIndexUrl] = useState('');
  const [indexResult, setIndexResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAudit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/seo?action=audit');
      const json = await res.json();
      if (json.success) setAudit(json.data);
      else setError(json.error);
    } catch {
      setError('Failed to fetch audit data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateKeywords = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/seo?action=keywords');
      const json = await res.json();
      if (json.success) setKeywords(json.data);
      else setError(json.error);
    } catch {
      setError('Failed to generate keywords');
    } finally {
      setIsLoading(false);
    }
  };

  const generateBacklinks = async (topic: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backlinks', payload: { topic } }),
      });
      const json = await res.json();
      if (json.success) setBacklinks(json.data);
      else setError(json.error);
    } catch {
      setError('Failed to generate backlink strategy');
    } finally {
      setIsLoading(false);
    }
  };

  const requestIndexing = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setIndexResult(null);
    try {
      const res = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'index', payload: { url } }),
      });
      const json = await res.json();
      if (json.success) setIndexResult(json.data.message);
      else setError(json.error);
    } catch {
      setError('Failed to request indexing');
    } finally {
      setIsLoading(false);
    }
  };

useEffect(() => {
    if (activeTab === 'audit' && !audit) fetchAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="text-brand-ink w-6 h-6" />
            Expert SEO Agent
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            BaliWild AI SEO Team. Managing your organic traffic, keywords, and indexing.
          </p>
        </div>
      </header>

      <div className="flex gap-1 border-b border-gray-200">
        {[
          { id: 'audit', label: 'SEO Health', icon: ShieldCheck },
          { id: 'keywords', label: 'Organic Keywords', icon: Search },
          { id: 'backlinks', label: 'Backlink Strategy', icon: LinkIcon },
          { id: 'indexing', label: 'Instant Indexing', icon: Globe },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'audit' | 'keywords' | 'backlinks' | 'indexing')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-brand-ink text-brand-ink'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Auditing your catalogue...</p>
              </div>
            ) : audit ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
                  <div className="text-4xl font-bold text-brand-ink mb-1">{audit.score}%</div>
                  <div className="text-sm text-gray-500">SEO Health Score</div>
                </div>
                <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="font-semibold mb-3">Priority Suggestions</h3>
                  <ul className="space-y-2">
                    {audit.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="md:col-span-3 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="font-semibold mb-3">Compliance Issues</h3>
                  {audit.issues.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No critical compliance issues found.</p>
                  ) : (
                    <div className="space-y-3">
                      {audit.issues.map((issue, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{issue.target}</p>
                            <p className="text-xs text-red-600">{issue.message}</p>
                          </div>
                          <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                            issue.type === 'critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {issue.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'keywords' && (
          <div className="space-y-4">
            <div className="bg-brand-ink/5 p-6 rounded-xl border border-brand-ink/10 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-brand-ink">Keyword Intelligence</h3>
                <p className="text-sm text-gray-600">Let the AI research high-potential long-tail keywords for your niche.</p>
              </div>
              <button
                onClick={generateKeywords}
                disabled={isLoading}
                className="bg-brand-ink text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Suggestions
              </button>
            </div>

            {keywords.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-gray-900">Keyword</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Difficulty</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Opportunity Score</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Reasoning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {keywords.map((kw, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 font-medium text-gray-900">{kw.keyword}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            kw.difficulty === 'low' ? 'bg-green-100 text-green-800' : 
                            kw.difficulty === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {kw.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full bg-gray-100 rounded-full h-2 max-w-[100px]">
                            <div className="bg-brand-ink h-2 rounded-full" style={{ width: `${kw.potential}%` }}></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-xs">{kw.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'backlinks' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">Backlink Target Topic</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Best ATV Ride in Ubud"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-brand-ink"
                  onKeyDown={(e) => e.key === 'Enter' && generateBacklinks((e.target as HTMLInputElement).value)}
                />
                <button
                  onClick={() => generateBacklinks((document.querySelector('input[placeholder="e.g. Best ATV Ride in Ubud"]') as HTMLInputElement).value)}
                  className="bg-brand-ink text-white px-6 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Plan Strategy'}
                </button>
              </div>
            </div>

            {backlinks && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="font-semibold mb-3">Target Sites & Niches</h3>
                  <div className="space-y-2">
                    {backlinks.targetSites.map((site, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-brand-ink">{site.url}</div>
                        <div className="text-xs text-gray-500">Niche: {site.niche} • {site.method}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="font-semibold mb-3">Outreach Template</h3>
                  {backlinks.outreachTemplates.map((tpl, i) => (
                    <div key={i} className="space-y-2">
                      <div className="text-xs font-bold text-gray-400 uppercase">Subject</div>
                      <div className="text-sm font-medium p-2 bg-gray-50 rounded">{tpl.subject}</div>
                      <div className="text-xs font-bold text-gray-400 uppercase mt-2">Body</div>
                      <div className="text-sm p-2 bg-gray-50 rounded whitespace-pre-wrap h-40 overflow-y-auto">{tpl.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'indexing' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-2xl">
              <h3 className="font-semibold mb-2">Google Instant Indexing</h3>
              <p className="text-sm text-gray-500 mb-4">
                Submit your new articles or products directly to Google Search Console to speed up crawling.
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={indexUrl}
                  onChange={(e) => setIndexUrl(e.target.value)}
                  placeholder="https://baliwild.com/experiences/ubud-atv-ride"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-brand-ink"
                />
                <button
                  onClick={() => requestIndexing(indexUrl)}
                  disabled={isLoading || !indexUrl}
                  className="bg-brand-ink text-white px-6 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Indexing'}
                </button>
              </div>
              {indexResult && (
                <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <p className="text-sm">{indexResult}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
