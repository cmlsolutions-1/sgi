import { decodeJwt, type JwtPayload } from "./jwt";

export type JwtVerificationConfig = { algorithm?: string; publicKey?: string; secret?: string; issuer?: string; audience?: string };

function decodeBytes(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid base64url");
  return Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=")), c => c.charCodeAt(0));
}

// The algorithm and key must come from server configuration, never JWT claims.
export async function verifySessionJwt(token: string, config: JwtVerificationConfig, now = Date.now()): Promise<JwtPayload | null> {
  try {
    if (token.length > 16384) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const header = JSON.parse(new TextDecoder().decode(decodeBytes(parts[0])));
    if (!config.algorithm || header.alg !== config.algorithm || header.crit !== undefined || header.b64 !== undefined) return null;
    let key: CryptoKey;
    let algorithm: AlgorithmIdentifier;
    if (config.algorithm === "RS256" && config.publicKey && !config.secret) {
      const pem = config.publicKey.replace(/\\n/g, "\n");
      if (!pem.includes("-----BEGIN PUBLIC KEY-----")) return null;
      const base64 = pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, "");
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      key = await crypto.subtle.importKey("spki", bytes, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
      algorithm = "RSASSA-PKCS1-v1_5";
    } else if (config.algorithm === "HS256" && config.secret && !config.publicKey) {
      const secret = new TextEncoder().encode(config.secret);
      if (secret.byteLength < 32) return null;
      key = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
      algorithm = "HMAC";
    } else return null;
    if (!await crypto.subtle.verify(algorithm, key, decodeBytes(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`))) return null;
    const payload = decodeJwt(token);
    if (!payload || !Number.isFinite(payload.exp) || payload.exp * 1000 <= now) return null;
    if (payload.nbf !== undefined && (!Number.isFinite(payload.nbf) || payload.nbf * 1000 > now)) return null;
    if (payload.iat !== undefined && (!Number.isFinite(payload.iat) || payload.iat * 1000 > now + 30000)) return null;
    if (config.issuer && payload.iss !== config.issuer) return null;
    if (config.audience && !(Array.isArray(payload.aud) ? payload.aud.includes(config.audience) : payload.aud === config.audience)) return null;
    return payload;
  } catch { return null; }
}

export function sessionVerificationConfig(): JwtVerificationConfig {
  return { algorithm: process.env.SESSION_JWT_ALGORITHM, publicKey: process.env.SESSION_JWT_PUBLIC_KEY, secret: process.env.SESSION_JWT_SECRET, issuer: process.env.SESSION_JWT_ISSUER, audience: process.env.SESSION_JWT_AUDIENCE };
}
