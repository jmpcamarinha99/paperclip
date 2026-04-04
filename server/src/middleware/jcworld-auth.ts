/**
 * JC World outer auth layer.
 * Validates Supabase JWT + checks user_apps access for the 'paperclip' app.
 * This runs BEFORE Paperclip's own auth (Better-Auth / actorMiddleware).
 */

import type { RequestHandler } from "express";
import https from "node:https";
import crypto from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://tvdwcwqtpusbjwsjtqnv.supabase.co";
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const PORTAL_URL = process.env.PORTAL_URL || "https://app.jc-world.com";
const APP_SLUG = "paperclip";
// Auth is ALWAYS enabled — no toggle allowed

const PUBLIC_PATHS = ["/health", "/api/health", "/favicon.ico", "/robots.txt", "/.well-known", "/invite", "/api/auth", "/api/invites"];

function base64urlDecode(str: string): Buffer {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64");
}

function verifyJwtHs256(token: string, secret: string): Record<string, any> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const signingInput = `${parts[0]}.${parts[1]}`;
    const signature = base64urlDecode(parts[2]);
    const expected = crypto.createHmac("sha256", secret).update(signingInput).digest();
    if (!crypto.timingSafeEqual(signature, expected)) return null;
    const payload = JSON.parse(base64urlDecode(parts[1]).toString());
    if (payload.exp && payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

function decodeJwtUnverified(token: string): Record<string, any> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(base64urlDecode(parts[1]).toString());
    if (payload.exp && payload.exp > Date.now() / 1000 && payload.sub) return payload;
    return null;
  } catch {
    return null;
  }
}

// ES256 JWKS verification (primary method — Supabase uses ES256)
let jwksCache: { keys: any[]; ts: number } | null = null;

async function fetchJwks(): Promise<any[]> {
  if (jwksCache && Date.now() - jwksCache.ts < 3600000) return jwksCache.keys;
  return new Promise((resolve) => {
    const url = `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`;
    https.get(url, (res) => {
      let data = "";
      res.on("data", (c: Buffer) => { data += c; });
      res.on("end", () => {
        try {
          const jwks = JSON.parse(data);
          jwksCache = { keys: jwks.keys || [], ts: Date.now() };
          resolve(jwksCache.keys);
        } catch { resolve(jwksCache?.keys || []); }
      });
    }).on("error", () => resolve(jwksCache?.keys || []));
  });
}

async function verifyJwtEs256(token: string): Promise<Record<string, any> | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(base64urlDecode(parts[0]).toString());
    if (header.alg !== "ES256") return null;
    const keys = await fetchJwks();
    const jwk = keys.find((k: any) => k.kid === header.kid) || keys[0];
    if (!jwk) return null;
    const keyObj = crypto.createPublicKey({ key: jwk, format: "jwk" });
    const signingInput = Buffer.from(`${parts[0]}.${parts[1]}`);
    const derSig = ecdsaJoseToDer(base64urlDecode(parts[2]));
    const valid = crypto.verify("sha256", signingInput, keyObj, derSig);
    if (!valid) return null;
    const payload = JSON.parse(base64urlDecode(parts[1]).toString());
    if (payload.exp && payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch { return null; }
}

function ecdsaJoseToDer(sig: Buffer): Buffer {
  const r = sig.subarray(0, 32);
  const s = sig.subarray(32, 64);
  function encodeInt(buf: Buffer): Buffer {
    let i = 0;
    while (i < buf.length - 1 && buf[i] === 0) i++;
    let b = buf.subarray(i);
    if (b[0] & 0x80) b = Buffer.concat([Buffer.from([0]), b]);
    return Buffer.concat([Buffer.from([0x02, b.length]), b]);
  }
  const dr = encodeInt(r);
  const ds = encodeInt(s);
  return Buffer.concat([Buffer.from([0x30, dr.length + ds.length]), dr, ds]);
}

async function verifyToken(token: string): Promise<Record<string, any> | null> {
  if (!token) return null;
  // Try ES256 (JWKS) first — this is what Supabase uses
  const es256 = await verifyJwtEs256(token);
  if (es256) return es256;
  // Fallback to HS256 if JWT_SECRET is set
  if (SUPABASE_JWT_SECRET) {
    const hs256 = verifyJwtHs256(token, SUPABASE_JWT_SECRET);
    if (hs256) return hs256;
  }
  return null;
}

function extractToken(req: any): string | null {
  const auth = req.headers?.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  const url = new URL(req.url || "/", `http://${req.headers?.host || "localhost"}`);
  const qToken = url.searchParams.get("token");
  if (qToken) return qToken;
  const cookies = req.headers?.cookie || "";
  const match = cookies.match(/sb-access-token=([^;]+)/);
  if (match) return match[1];
  return null;
}

function checkUserAccess(userId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!SUPABASE_SERVICE_ROLE_KEY) { resolve(true); return; }
    const url = new URL(
      `${SUPABASE_URL}/rest/v1/user_apps?select=role,apps!inner(slug)&user_id=eq.${userId}&apps.slug=eq.${APP_SLUG}`
    );
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Accept: "application/json",
      },
      timeout: 5000,
    };
    https
      .get(options, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try { resolve(JSON.parse(data).length > 0); }
          catch { resolve(false); }
        });
      })
      .on("error", () => resolve(false));
  });
}

const LOGIN_HTML = `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Login</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;background:#030712;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center}.c{text-align:center;padding:2rem;max-width:400px}h1{font-size:1.5rem;margin:1rem 0 .5rem}p{color:#9ca3af;font-size:.875rem;margin-bottom:2rem}a{background:#2563eb;color:#fff;text-decoration:none;padding:.75rem 2rem;border-radius:.5rem;font-weight:600}</style></head>
<body><div class="c"><div style="font-size:3rem">&#128273;</div><h1>Autenticacao necessaria</h1><p>Precisas de fazer login para aceder ao Paperclip.</p><a href="${PORTAL_URL}">Entrar no Portal</a></div></body></html>`;

const DENIED_HTML = `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Acesso Negado</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;background:#030712;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center}.c{text-align:center;padding:2rem;max-width:400px}h1{font-size:1.5rem;margin:1rem 0 .5rem}p{color:#9ca3af;font-size:.875rem;margin-bottom:2rem}a{background:#2563eb;color:#fff;text-decoration:none;padding:.75rem 2rem;border-radius:.5rem;font-weight:600}</style></head>
<body><div class="c"><div style="font-size:3rem">&#128274;</div><h1>Acesso Negado</h1><p>Nao tens permissao para aceder ao Paperclip.</p><a href="${PORTAL_URL}">Ir para o Portal</a></div></body></html>`;

export function jcWorldAuth(): RequestHandler {
  return async (req, res, next) => {
    // Auth always active — removed JC_AUTH_ENABLED toggle

    const path = req.path;

    // Public paths and agent API calls (agents use Paperclip's own auth)
    if (PUBLIC_PATHS.some(p => path === p || path.startsWith(p + "/"))) return next();
    if (path.startsWith("/api/") && req.headers["x-paperclip-agent-key"]) return next();
    if (path.startsWith("/static/") || path.startsWith("/assets/") || path.startsWith("/_next/")) return next();
    // Allow common static assets at root (favicons, manifests, service worker)
    if (/^\/(favicon[\w.-]*|site\.webmanifest|sw\.js|apple-touch-icon[\w.-]*)$/.test(path)) return next();

    const token = extractToken(req);
    if (!token) {
      if (path.startsWith("/api/")) {
        res.status(401).json({ error: "Autenticação JC World necessária" });
      } else {
        res.status(401).type("html").send(LOGIN_HTML);
      }
      return;
    }

    const payload = await verifyToken(token);
    if (!payload) {
      if (path.startsWith("/api/")) {
        res.status(401).json({ error: "Token JC World inválido" });
      } else {
        res.status(401).type("html").send(LOGIN_HTML);
      }
      return;
    }

    const userId = payload.sub;
    const hasAccess = await checkUserAccess(userId);
    if (!hasAccess) {
      if (path.startsWith("/api/")) {
        res.status(403).json({ error: "Sem acesso ao Paperclip" });
      } else {
        res.status(403).type("html").send(DENIED_HTML);
      }
      return;
    }

    next();
  };
}
