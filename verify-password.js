const { scryptSync, timingSafeEqual } = require('node:crypto');

function verifyPassword(password, stored) {
  const [scheme, salt, expectedHex] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, 'hex');
  if (expected.length === 0) return false;

  const derived = scryptSync(password, salt, expected.length);
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

const storedHash = "scrypt$24350326751dd78a7f8d425aa3afbf14$925b988add88157557709d8dd778108be3a60806e3154a43e896c4bcd1e793f299e5487e99de10e521898db4872a35e1deb1fa0ae0dc90b311873373a287dc34";
const testPasswords = [
  "BaliWild2026!",
  "BaliWild2026",
  "baliwild2026!",
  "Baliwild2026!",
  "password",
  "admin123"
];

for (const pwd of testPasswords) {
  const result = verifyPassword(pwd, "scrypt$24350326751dd78a7f8d425aa3afbf14$925b988add88157557709d8dd778108be3a60806e3154a43e896c4bcd1e793f299e5487e99de10e521898db4872a35e1deb1fa0ae0dc90b311873373a287dc34");
  console.log(`Password: "${pwd}" => ${result}`);
}