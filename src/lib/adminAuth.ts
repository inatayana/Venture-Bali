/**
 * BaliWild — Admin Password Hashing
 * -------------------------------------
 * Password hashing for the operator panel, now backed by the shared OWASP
 * implementation in `src/lib/passwordHash.ts` (scrypt N=2^17, r=8, p=1).
 * Legacy 3-part hashes (N=2^14) remain verifiable.
 *
 * NODE ONLY: this module must never be imported from the Edge middleware.
 * Session handling lives in `src/lib/adminSession.ts`, which is Edge safe.
 *
 * Docs: docs/SECURITY_PROTOCOL.md
 */

export { hashPassword, verifyPassword } from './passwordHash';
