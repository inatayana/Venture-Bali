import { Sparkles } from 'lucide-react';

const CAPABILITIES = [
  {
    title: 'Long-tail SEO Article Generator',
    description: 'Generate SEO articles from venture keywords, saved to the Article table and linked to the sitemap automatically.',
  },
  {
    title: 'Meta Description & Structured Data',
    description: 'Auto-generate meta descriptions and FAQ schema per venture for rich snippets.',
  },
  {
    title: 'Internal Linking Matrix',
    description: 'Scan new articles for product keywords and auto-link to /ventures/[slug] pages.',
  },
  {
    title: 'Ad Copy & Social Post Wizard',
    description: 'Generate promotional copy and social media posts from venture highlights.',
  },
];

export default function AdminContentPage() {
  return (
    <div>
      <h1 className="heading-caps text-2xl text-gray-900 mb-1">AI Content Wizard</h1>
      <p className="text-sm text-gray-500 mb-6">Autonomous marketing engine — planned for Fase 4</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {CAPABILITIES.map(({ title, description }) => (
          <div key={title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h2 className="font-heading font-semibold text-gray-900">{title}</h2>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 max-w-xl">
        <h2 className="heading-caps text-lg text-gray-900 mb-2">Generate Article</h2>
        <p className="text-sm text-gray-500 mb-4">
          Connected to the Gemini API in Fase 4. Generated drafts will be stored in the Article table and published to /blog.
        </p>
        <div className="border border-dashed border-gray-200 rounded-lg p-4 text-sm text-gray-400 bg-gray-50">
          Draft editor will be available once the AI Content Wizard is implemented.
        </div>
      </div>
    </div>
  );
}
