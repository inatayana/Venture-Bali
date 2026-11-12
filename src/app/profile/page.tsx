'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Users,
  Edit,
  Briefcase,
  GraduationCap,
  Music,
  Heart,
  BookOpen,
  Languages,
  Shield,
  MapPin,
  MessageSquare,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { BottomSheet } from '@/components/ui';
import { LanguageSwitcher } from '@/components/locale/LanguageSwitcher';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';

/**
 * Profile page — the guest's account destination with About me / Connections tabs.
 * Left sidebar navigation, right content split layout.
 */
export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'about' | 'connections'>('about');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const tabs = [
    { id: 'about', label: 'About me', icon: User },
    { id: 'connections', label: 'Connections', icon: Users },
  ];

  const personalInfo = [
    { icon: Briefcase, label: 'Work', value: 'Host at BaliWild Adventures' },
    { icon: GraduationCap, label: 'Education', value: 'Tourism Management, Udayana University' },
    { icon: Music, label: 'Favorite music', value: 'Indie folk, Gamelan fusion' },
    { icon: Heart, label: 'Hobbies', value: 'Surfing, Hiking, Photography' },
    { icon: BookOpen, label: 'Bio title', value: 'Local Guide & Storyteller' },
    { icon: Languages, label: 'Languages', value: 'Indonesian, English, Balinese' },
    { icon: Shield, label: 'Identity', value: 'Verified ✓' },
  ];

  const interests = [
    { icon: '🎨', label: 'Art and design' },
    { icon: '🍳', label: 'Cooking' },
    { icon: '📸', label: 'Photography' },
    { icon: '✈️', label: 'Travel' },
    { icon: '🏄', label: 'Surfing' },
    { icon: '🥾', label: 'Hiking' },
    { icon: '🧘', label: 'Yoga & Wellness' },
    { icon: '🍵', label: 'Coffee culture' },
  ];

  function AboutTab() {
    return (
      <>
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <h2 id="about-heading" className="font-heading text-2xl font-bold text-neutral-900 dark:text-white">
            About me
          </h2>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:text-brand-ink dark:text-neutral-300 dark:hover:text-white"
            aria-label="Edit profile"
          >
            <Edit className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </button>
        </div>

        {/* Profile Card */}
        <div className="relative flex flex-col items-center gap-4 rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10">
          {/* Decorative top accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-brand to-brand/50 rounded-b-full" aria-hidden="true" />

          <div className="relative mt-4 flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/20 to-brand/40 text-brand-ink font-heading text-3xl font-bold">
              I
            </div>
            {/* Verification badge on avatar */}
            <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-lg">
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>

          <div className="text-center">
            <h3 className="font-heading text-2xl font-bold text-neutral-900 dark:text-white">
              I Ketut
            </h3>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Gianyar, Indonesia</span>
            </p>
          </div>
        </div>

        {/* Personal Info Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {personalInfo.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand-ink dark:bg-brand/20 dark:text-brand">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{item.label}</p>
                <p className="mt-0.5 text-sm font-medium text-neutral-900 dark:text-white truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bio Paragraph */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            Born and raised in the cultural heart of Bali, I&apos;ve spent the last decade sharing the island&apos;s hidden gems with travelers from around the world. As a certified local guide and host, I believe the best adventures happen off the beaten path — where rice terraces meet volcanic peaks, and every village has a story to tell. When I&apos;m not leading trips, you&apos;ll find me catching sunrise waves at Sanur, experimenting with traditional recipes, or documenting daily life through my lens. Let&apos;s make your Bali journey unforgettable.
          </p>
        </div>

        {/* My Interests Section */}
        <div>
          <h3 className="font-heading text-lg font-bold text-neutral-900 dark:text-white mb-4">My interests</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {interests.map((interest, index) => (
              <button
                key={index}
                type="button"
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-brand-ink dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <span aria-hidden="true">{interest.icon}</span>
                {interest.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Link */}
        <div className="pt-4 border-t border-neutral-200 dark:border-white/10">
          <Link
            href="/reviews/mine"
            className="flex items-center gap-2 text-sm font-medium text-brand-ink hover:underline dark:text-brand"
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            Show reviews I&apos;ve written
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </>
    );
  }

  function ConnectionsTab() {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="h-16 w-16 text-neutral-300 dark:text-neutral-600 mb-4" aria-hidden="true" />
        <h3 className="font-heading text-xl font-bold text-neutral-900 dark:text-white mb-2">Connections</h3>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-sm mb-6">
          Connect with other travelers, hosts, and guides. Your network will appear here.
        </p>
        <button className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-ink px-6 text-base font-semibold text-white hover:bg-neutral-900 transition-colors">
          Find connections
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-heading text-3xl font-bold text-neutral-900 dark:text-white">Profile</h1>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Left Sidebar: Profile Navigation */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav className="space-y-1 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10" aria-label="Profile navigation">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as 'about' | 'connections')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand ${
                    activeTab === tab.id
                      ? 'bg-brand/10 text-brand-ink dark:bg-brand/20 dark:text-brand'
                      : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-white/5'
                  }`}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <tab.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Settings button at bottom of sidebar */}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="mt-4 w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10 dark:text-neutral-300 dark:hover:bg-white/5"
            >
              <SlidersHorizontal className="h-5 w-5 shrink-0 text-neutral-500" aria-hidden="true" />
              Preferences
            </button>
          </aside>

          {/* Right Content: Profile Details */}
          <section className="space-y-8" aria-labelledby="about-heading">
            {activeTab === 'about' ? <AboutTab /> : <ConnectionsTab />}
          </section>
        </div>
      </div>

      {/* Preferences Bottom Sheet */}
      <BottomSheet isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Preferences">
        <div className="space-y-5 pb-2">
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Language</h3>
            <div className="mt-2"><LanguageSwitcher /></div>
          </section>
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Currency</h3>
            <p className="mt-1 text-xs text-neutral-600">Charged in IDR. Other currencies are approximate.</p>
            <div className="mt-2"><CurrencySelector /></div>
          </section>
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Theme</h3>
            <div className="mt-2"><ThemeSwitcher /></div>
          </section>
        </div>
      </BottomSheet>
    </main>
  );
}