#!/usr/bin/env node
/**
 * SEO CI Check — runs on every PR and in CI.
 *
 * Verifies:
 * 1. No `noindex` URLs in the sitemap.
 * 2. Every page in the sitemap has a valid canonical.
 * 3. No broken internal links.
 *
 * Exit code: 0 = pass, 1 = fail.
 * No new npm dependencies; uses native fetch and Node APIs only.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://baliwild.com';
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;

// Pages that are allowed to be noindex (must NOT be in sitemap)
const ALLOWED_NOINDEX = ['/explore'];

async function fetchWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function getSitemapUrls() {
  const res = await fetchWithTimeout(SITEMAP_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch sitemap: ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();

  const urls = [];
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1].replace(/&/g, '&');
    try {
      const parsed = new URL(url);
      if (parsed.origin === BASE_URL) {
        urls.push(parsed.pathname);
      }
    } catch {
      // skip invalid
    }
  }
  return urls;
}

async function checkNoindexInSitemap() {
  console.log('\n🔎 Checking noindex pages in sitemap...');
  const urls = await getSitemapUrls();
  const violations = [];

  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}${url}`);
      const html = await res.text();

      // Check for noindex meta tag
      const hasNoindex = /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html);

      // Check for X-Robots-Tag header
      const xRobots = res.headers.get('x-robots-tag');
      const hasXNoindex = xRobots?.toLowerCase().includes('noindex') ?? false;

      if (hasNoindex || hasXNoindex) {
        if (!ALLOWED_NOINDEX.includes(url)) {
          violations.push({ url, reason: hasNoindex ? 'meta robots noindex' : 'x-robots-tag noindex' });
        }
      }
    } catch (e) {
      console.warn(`  ⚠️  Could not check ${url}: ${e.message}`);
    }
  }

  if (violations.length > 0) {
    console.error('❌ FAIL: Found noindex URLs in sitemap:');
    for (const v of violations) {
      console.error(`  - ${v.url} (${v.reason})`);
    }
    return false;
  }

  console.log('✅ PASS: No noindex URLs in sitemap.');
  return true;
}

async function checkCanonicals() {
  console.log('\n🔗 Checking canonical tags...');
  const urls = await getSitemapUrls();
  const violations = [];

  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}${url}`);
      const html = await res.text();

      // Find canonical link
      const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
      if (!canonicalMatch) {
        violations.push({ url, reason: 'Missing canonical tag' });
        continue;
      }

      const canonical = canonicalMatch[1];
      const expected = `${BASE_URL}${url}`;

      if (canonical !== expected) {
        violations.push({ url, reason: `Canonical mismatch: got ${canonical}, expected ${expected}` });
      }
    } catch (e) {
      console.warn(`  ⚠️  Could not check ${url}: ${e.message}`);
    }
  }

  if (violations.length > 0) {
    console.error('❌ FAIL: Canonical issues:');
    for (const v of violations) {
      console.error(`  - ${v.url}: ${v.reason}`);
    }
    return false;
  }

  console.log('✅ PASS: All canonicals valid.');
  return true;
}

async function checkInternalLinks() {
  console.log('\n🔍 Checking internal links...');
  const urls = await getSitemapUrls();
  const brokenLinks = [];

  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}${url}`);
      const html = await res.text();

      // Extract all internal links (href starting with / or BASE_URL)
      const linkRegex = /href=["']([^"']+)["']/g;
      let match;
      while ((match = linkRegex.exec(html)) !== null) {
        const href = match[1];
        if (href.startsWith('http')) {
          // External link - skip for now
          continue;
        }
        if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
          continue;
        }
        if (!href.startsWith('/')) continue;

        try {
          const linkRes = await fetchWithTimeout(`${BASE_URL}${href}`, 5000);
          if (!linkRes.ok) {
            brokenLinks.push({ from: url, to: href, status: linkRes.status });
          }
        } catch (e) {
          brokenLinks.push({ from: url, to: href, error: e.message });
        }
      }
    } catch (e) {
      console.warn(`  ⚠️  Could not check ${url}: ${e.message}`);
    }
  }

  if (brokenLinks.length > 0) {
    console.error('❌ FAIL: Broken internal links:');
    for (const b of brokenLinks) {
      console.error(`  - ${b.from} → ${b.to} (${b.status ?? b.error})`);
    }
    return false;
  }

  console.log('✅ PASS: No broken internal links.');
  return true;
}

async function main() {
  console.log('🚀 SEO CI Check starting...');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Sitemap: ${SITEMAP_URL}`);

  const results = await Promise.all([
    checkNoindexInSitemap(),
    checkCanonicals(),
    checkInternalLinks(),
  ]);

  const passed = results.every((r) => r === true);

  if (passed) {
    console.log('\n🎉 All SEO checks passed!');
    process.exit(0);
  } else {
    console.log('\n💥 SEO checks failed.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});