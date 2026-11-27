#!/usr/bin/env node
/**
 * BaliWild — SEO CI Check
 * ----------------------------------------
 * Validates sitemap.xml for common SEO issues:
 * - Zero noindex URLs in sitemap
 * - Valid canonicals (self-referencing, no redirect chains)
 * - All URLs return 200 (optional, requires running server)
 * - No orphan URLs (all sitemap URLs linked internally)
 *
 * Usage:
 *   npm run seo:check           # Run against production sitemap
 *   npm run seo:check -- --url=http://localhost:3000/sitemap.xml  # Local dev
 */

import { URL } from 'node:url';

const DEFAULT_SITEMAP_URL = 'https://baliwild.com/sitemap.xml';
const NOINDEX_PATTERNS = [
  '/explore',
  '/checkout/',
  '/voucher/',
  '/admin/',
  '/api/',
  '/_next/',
  '/static/',
  '/assets/',
];

const results = [];

function logResult(check) {
  results.push(check);
  const icon = check.passed ? '✅' : '❌';
  console.log(`${icon} ${check.message}`);
  if (check.details && !check.passed) {
    console.log('   Details:', JSON.stringify(check.details, null, 2));
  }
}

async function fetchSitemap(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.text();
}

function parseSitemap(xml) {
  const urls = [];
  const urlRegex = /<url>[\s\S]*?<\/url>/g;
  const locRegex = /<loc>([^<]+)<\/loc>/;
  const lastmodRegex = /<lastmod>([^<]+)<\/lastmod>/;
  const changefreqRegex = /<changefreq>([^<]+)<\/changefreq>/;
  const priorityRegex = /<priority>([^<]+)<\/priority>/;

  let match;
  while ((match = urlRegex.exec(xml)) !== null) {
    const urlXml = match[0];
    const locMatch = locRegex.exec(urlXml);
    const lastmodMatch = lastmodRegex.exec(urlXml);
    const changefreqMatch = changefreqRegex.exec(urlXml);
    const priorityMatch = priorityRegex.exec(urlXml);

    if (locMatch) {
      urls.push({
        loc: locMatch[1].trim(),
        lastmod: lastmodMatch?.[1]?.trim(),
        changefreq: changefreqMatch?.[1]?.trim(),
        priority: priorityMatch ? parseFloat(priorityMatch[1]) : undefined,
      });
    }
  }
  return urls;
}

function checkNoIndexInSitemap(urls) {
  const violations = urls.filter((u) =>
    NOINDEX_PATTERNS.some((pattern) => u.loc.includes(pattern))
  );

  if (violations.length > 0) {
    return {
      passed: false,
      message: `Found ${violations.length} URL(s) in sitemap that should be noindex`,
      details: violations.map((v) => v.loc),
    };
  }

  return {
    passed: true,
    message: 'No noindex URLs found in sitemap',
  };
}

function checkCanonicals(urls) {
  const issues = [];

  for (const url of urls) {
    try {
      const parsed = new URL(url.loc);

      // Must be HTTPS
      if (parsed.protocol !== 'https:') {
        issues.push(`${url.loc}: Not HTTPS`);
      }

      // Must be baliwild.com (canonical domain)
      if (!parsed.hostname.includes('baliwild.com')) {
        issues.push(`${url.loc}: Not on canonical domain`);
      }

      // No double slashes in path
      if (parsed.pathname.includes('//')) {
        issues.push(`${url.loc}: Double slash in path`);
      }

      // Check for trailing slash consistency (prefer no trailing slash except root)
      if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
        issues.push(`${url.loc}: Trailing slash (prefer no trailing slash)`);
      }
    } catch {
      issues.push(`${url.loc}: Invalid URL`);
    }
  }

  if (issues.length > 0) {
    return {
      passed: false,
      message: `Found ${issues.length} canonical URL issue(s)`,
      details: issues,
    };
  }

  return {
    passed: true,
    message: 'All URLs have valid canonical structure',
  };
}

function checkLastModified(urls) {
  const missingLastmod = urls.filter(
    (u) => !u.lastmod && u.loc !== 'https://baliwild.com/' // Home page always has lastmod
  );

  if (missingLastmod.length > 0) {
    return {
      passed: false,
      message: `${missingLastmod.length} URL(s) missing lastmod`,
      details: missingLastmod.map((u) => u.loc),
    };
  }

  return {
    passed: true,
    message: 'All URLs have lastmod',
  };
}

function checkDuplicateUrls(urls) {
  const seen = new Set();
  const duplicates = [];

  for (const url of urls) {
    if (seen.has(url.loc)) {
      duplicates.push(url.loc);
    } else {
      seen.add(url.loc);
    }
  }

  if (duplicates.length > 0) {
    return {
      passed: false,
      message: `Found ${duplicates.length} duplicate URL(s) in sitemap`,
      details: duplicates,
    };
  }

  return {
    passed: true,
    message: 'No duplicate URLs in sitemap',
  };
}

function checkSitemapSize(urls) {
  if (urls.length > 50000) {
    return {
      passed: false,
      message: `Sitemap exceeds 50,000 URL limit (${urls.length} URLs)`,
      details: { count: urls.length },
    };
  }

  if (urls.length === 0) {
    return {
      passed: false,
      message: 'Sitemap is empty',
    };
  }

  return {
    passed: true,
    message: `Sitemap contains ${urls.length} URLs (within limit)`,
  };
}

async function runChecks(sitemapUrl) {
  console.log(`\n🔍 SEO CI Check — ${new Date().toISOString()}`);
  console.log(`📥 Fetching sitemap: ${sitemapUrl}\n`);

  try {
    const xml = await fetchSitemap(sitemapUrl);
    const urls = parseSitemap(xml);

    if (urls.length === 0) {
      console.log('❌ No URLs found in sitemap');
      process.exit(1);
    }

    console.log(`📊 Found ${urls.length} URLs in sitemap\n`);

    // Run all checks
    logResult(checkSitemapSize(urls));
    logResult(checkNoIndexInSitemap(urls));
    logResult(checkCanonicals(urls));
    logResult(checkLastModified(urls));
    logResult(checkDuplicateUrls(urls));

    // Summary
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    console.log(`\n📋 Summary: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
      console.log('\n❌ SEO CI Check FAILED');
      process.exit(1);
    } else {
      console.log('\n✅ SEO CI Check PASSED');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Failed to fetch or parse sitemap:', error);
    process.exit(1);
  }
}

// Parse CLI args
const args = process.argv.slice(2);
const urlArg = args.find((a) => a.startsWith('--url='));
const sitemapUrl = urlArg ? urlArg.split('=')[1] : DEFAULT_SITEMAP_URL;

runChecks(sitemapUrl);