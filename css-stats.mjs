// Usage:
//   node scripts/css-stats.mjs save-before
//   node scripts/css-stats.mjs save-after
//   node scripts/css-stats.mjs report
//
// Writes JSON snapshots to .stats/css.before.json and .stats/css.after.json,
// then prints a per-file + total table with raw and gzipped sizes.

import { promises as fs } from "fs";
import path from "path";
import zlib from "zlib";

const SITE_CSS_DIR = path.resolve("_site/assets/css");
const STATS_DIR = path.resolve(".stats");
const BEFORE_JSON = path.join(STATS_DIR, "css.before.json");
const AFTER_JSON = path.join(STATS_DIR, "css.after.json");

const KB = 1024;
const fmtKB = (n) => (n / KB).toFixed(2) + " KB";
const pct = (a, b) => (b ? ((a - b) / b) * 100 : 0);

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function listFilesRecursive(dir) {
  const out = [];
  async function walk(d) {
    let entries;
    try {
      entries = await fs.readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else out.push(p);
    }
  }
  await walk(dir);
  return out;
}

function isCss(p) {
  return p.endsWith(".css") && !p.endsWith(".map") && !path.basename(p).startsWith("_purgecss");
}

async function fileStat(p) {
  const buf = await fs.readFile(p);
  return {
    file: path.relative(process.cwd(), p),
    size: buf.byteLength,
    gzip: zlib.gzipSync(buf).byteLength,
  };
}

async function snapshot(toPath) {
  const files = (await listFilesRecursive(SITE_CSS_DIR)).filter(isCss);
  const stats = [];
  for (const f of files) stats.push(await fileStat(f));
  const total = stats.reduce((a, s) => ({ size: a.size + s.size, gzip: a.gzip + s.gzip }), { size: 0, gzip: 0 });
  const payload = { generatedAt: new Date().toISOString(), dir: path.relative(process.cwd(), SITE_CSS_DIR), files: stats, total };
  await ensureDir(STATS_DIR);
  await fs.writeFile(toPath, JSON.stringify(payload, null, 2));
  console.log(`Saved CSS stats → ${path.relative(process.cwd(), toPath)} (${stats.length} files)`);
}

function pad(str, n) {
  return (str + " ".repeat(n)).slice(0, n);
}

function printReport(before, after) {
  const mapB = new Map(before.files.map((f) => [f.file, f]));
  const mapA = new Map(after.files.map((f) => [f.file, f]));
  const files = Array.from(new Set([...mapB.keys(), ...mapA.keys()])).sort();

  const rows = files
    .map((f) => {
      const b = mapB.get(f) || { size: 0, gzip: 0 };
      const a = mapA.get(f) || { size: 0, gzip: 0 };
      return {
        file: f,
        bSize: b.size,
        bGzip: b.gzip,
        aSize: a.size,
        aGzip: a.gzip,
        dSize: b.size - a.size,
        dGzip: b.gzip - a.gzip,
        pctGz: pct(b.gzip, b.gzip), // placeholder; we display using b/a below
      };
    })
    .sort((x, y) => y.dGzip - x.dGzip); // biggest gz savings first

  const header = pad("FILE", 46) + pad("BEFORE", 18) + pad("AFTER", 18) + pad("SAVED", 18) + "SAVED % (gz)";
  console.log("\nCSS Purge Stats\n" + header);
  console.log("-".repeat(header.length));

  for (const r of rows) {
    const gzPct = r.bGzip ? ((r.bGzip - r.aGzip) / r.bGzip) * 100 : 0;
    console.log(
      pad(r.file, 46) +
        pad(`${fmtKB(r.bSize)} | ${fmtKB(r.bGzip)}`, 18) +
        pad(`${fmtKB(r.aSize)} | ${fmtKB(r.aGzip)}`, 18) +
        pad(`${fmtKB(r.dSize)} | ${fmtKB(r.dGzip)}`, 18) +
        `${gzPct.toFixed(1)}%`
    );
  }

  const bT = before.total,
    aT = after.total;
  const dTsize = bT.size - aT.size,
    dTgz = bT.gzip - aT.gzip;
  const pctTgz = bT.gzip ? (dTgz / bT.gzip) * 100 : 0;

  console.log("-".repeat(header.length));
  console.log(
    pad("TOTAL", 46) +
      pad(`${fmtKB(bT.size)} | ${fmtKB(bT.gzip)}`, 18) +
      pad(`${fmtKB(aT.size)} | ${fmtKB(aT.gzip)}`, 18) +
      pad(`${fmtKB(dTsize)} | ${fmtKB(dTgz)}`, 18) +
      `${pctTgz.toFixed(1)}%`
  );
  console.log();
}

async function main() {
  const cmd = process.argv[2];
  if (cmd === "save-before") return snapshot(BEFORE_JSON);
  if (cmd === "save-after") return snapshot(AFTER_JSON);
  if (cmd === "report") {
    const [b, a] = await Promise.all([fs.readFile(BEFORE_JSON, "utf8"), fs.readFile(AFTER_JSON, "utf8")]);
    return printReport(JSON.parse(b), JSON.parse(a));
  }
  console.error("Usage: node scripts/css-stats.mjs save-before|save-after|report");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
