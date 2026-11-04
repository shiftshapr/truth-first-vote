// truthfirst.vote: one landing page + a founding-player sign-up list.
// No dependencies, no trackers, no third-party scripts. Sign-ups go to data/signups.jsonl.
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3041);
const HOST = process.env.HOST || "127.0.0.1";
const GOAL = Number(process.env.FOUNDER_GOAL || 100);
const COUNTRY_THRESHOLD = Number(process.env.COUNTRY_THRESHOLD || 10);
const ROLES = new Set(["player", "organizer", "spokesperson"]);
const DATA = process.env.DATA_FILE || path.join(__dirname, "data", "signups.jsonl");
const PUBLIC = path.join(__dirname, "public");

fs.mkdirSync(path.dirname(DATA), { recursive: true });

// Load existing sign-ups. In memory we keep only email hashes (de-duplication) and per-country counts.
const seen = new Set();
const countries = new Map(); // normalized key -> { name, count }
const ALIASES = { "usa": "United States", "us": "United States", "u.s.": "United States", "u.s.a.": "United States", "america": "United States", "united states of america": "United States", "uk": "United Kingdom", "england": "United Kingdom", "great britain": "United Kingdom", "turkey": "Türkiye" };
// Canonical spellings from the same list the forms suggest, so "kenya" and "Kenya" count together.
const KNOWN = new Map();
try {
  const m = fs.readFileSync(path.join(PUBLIC, "countries.js"), "utf8").match(/TF_COUNTRIES = (\[.*?\]);/s);
  for (const c of JSON.parse(m[1])) KNOWN.set(c.toLowerCase(), c);
} catch (e) { console.error("country list not loaded:", e.message); }
function normCountry(raw) {
  const name = String(raw || "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!name) return null;
  const key = name.toLowerCase();
  const canon = ALIASES[key] || KNOWN.get(key) || name;
  return { key: canon.toLowerCase(), name: canon };
}
function countCountry(raw) {
  const c = normCountry(raw);
  if (!c) return;
  const cur = countries.get(c.key) || { name: c.name, count: 0 };
  cur.count += 1;
  countries.set(c.key, cur);
}
if (fs.existsSync(DATA)) {
  for (const line of fs.readFileSync(DATA, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try { const rec = JSON.parse(line); seen.add(rec.emailHash); countCountry(rec.country); } catch {}
  }
}

const hash = (s) => crypto.createHash("sha256").update(s).digest("hex");
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

// Tiny per-IP rate limit: 5 sign-up attempts per 10 minutes.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 5;
}

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".txt": "text/plain" };

function send(res, code, body, type = "application/json") {
  res.writeHead(code, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:",
  });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 8192) { reject(new Error("too large")); req.destroy(); } });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const clean = (v, max) => String(v || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");

  if (url.pathname === "/api/count" && req.method === "GET") {
    return send(res, 200, { count: seen.size, goal: GOAL });
  }

  if (url.pathname === "/api/countries" && req.method === "GET") {
    // Only list known country names publicly; free text is grouped as "Other" so nobody can post arbitrary words here.
    const shown = new Map();
    for (const [key, c] of countries) {
      const known = KNOWN.has(key);
      const k = known ? key : "\u0000other";
      const cur = shown.get(k) || { name: known ? c.name : "Other", count: 0 };
      cur.count += c.count;
      shown.set(k, cur);
    }
    const list = [...shown.values()].sort((a, b) => (a.name === "Other") - (b.name === "Other") || b.count - a.count || a.name.localeCompare(b.name));
    return send(res, 200, { countries: list, threshold: COUNTRY_THRESHOLD });
  }

  if (url.pathname === "/api/join" && req.method === "POST") {
    const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
    if (limited(ip)) return send(res, 429, { error: "Too many tries. Give it a few minutes." });
    let body;
    try { body = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: "Bad request." }); }
    if (body.website) return send(res, 200, { ok: true, count: seen.size, goal: GOAL }); // honeypot
    const email = clean(body.email, 320).toLowerCase();
    if (!EMAIL_RE.test(email)) return send(res, 400, { error: "That email doesn't look right." });
    if (!body.agree) return send(res, 400, { error: "Please confirm you've read what this is." });
    const emailHash = hash(email);
    if (seen.has(emailHash)) return send(res, 200, { ok: true, already: true, count: seen.size, goal: GOAL });
    const rec = {
      at: new Date().toISOString(),
      name: clean(body.name, 80),
      email,
      emailHash,
      country: (normCountry(body.country) || {}).name || "",
      state: clean(body.state, 40),
      role: ROLES.has(body.role) ? body.role : "player",
      leaning: clean(body.leaning, 40),
      bring: clean(body.bring, 500),
    };
    fs.appendFileSync(DATA, JSON.stringify(rec) + "\n", { mode: 0o600 });
    seen.add(emailHash);
    countCountry(rec.country);
    return send(res, 200, { ok: true, count: seen.size, goal: GOAL });
  }

  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, { error: "Method not allowed" });

  let p = decodeURIComponent(url.pathname);
  if (p === "/") p = "/index.html";
  else if (!path.extname(p)) p = p.replace(/\/$/, "") + ".html";
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC + path.sep)) return send(res, 404, "Not found", "text/plain");
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, "Not found", "text/plain");
    send(res, 200, buf, TYPES[path.extname(file)] || "application/octet-stream");
  });
});

server.listen(PORT, HOST, () => console.log(`truthfirst.vote on http://${HOST}:${PORT} (${seen.size}/${GOAL} founders)`));
