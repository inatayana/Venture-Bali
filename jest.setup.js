import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';
import { fetch, Request, Response, Headers } from 'cross-fetch';

// jsdom does not expose the text encoding globals that the Edge runtime and
// Node both provide. Modules that use Web Crypto (for example
// src/lib/adminSession.ts) need them, so we add them here.
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}

if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder;
}

// jsdom ships no Web Crypto implementation. Node does, so reuse it so the
// session tests exercise the real signing and verification code.
if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.subtle) {
  const { webcrypto } = require('node:crypto');
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
    writable: true,
  });
}

// Polyfill fetch for jsdom (used by ExperienceBookingWidget availability API)
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = fetch;
  globalThis.Request = Request;
  globalThis.Response = Response;
  globalThis.Headers = Headers;
}
