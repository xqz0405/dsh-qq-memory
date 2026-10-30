#!/usr/bin/env node
// 提起来才算记得：扫最近这段时间的对话，凡是提到过的话题，就把 mind 里对应的记忆 touch 一下。
// 用法: node mind-recall.mjs [--hours 20] [--dry]
//   靠 3 字窗口匹配（中文够具体），一条记忆命中 >=2 个不同窗口才算「提起过」，防止误触。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const MIND = path.join(DIR, 'memory.json');
const SESS = path.join(DIR, '..', 'long', 'sessions');
const LOG = path.join(DIR, 'recall.log');
const TAU_BASE = 8, TAU_GAIN = 1.2;

const now = () => Date.now();
const days = (ms) => ms / 86400000;
const tau = (e) => TAU_BASE * (1 + TAU_GAIN * e.hits);

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const HOURS = Number(arg('hours', 20));
const DRY = argv.includes('--dry');

function load() {
  try { return JSON.parse(fs.readFileSync(MIND, 'utf8')); } catch { return { version: 1, seq: 0, entries: [] }; }
}
function save(db) { fs.writeFileSync(MIND, JSON.stringify(db, null, 1), 'utf8'); }

function applyDecay(db, t = now()) {
  for (const e of db.entries) {
    const base = e.decayedAt ?? db.lastDecay ?? e.last;
    const dt = Math.max(0, days(t - base));
    e.decayedAt = t;
    e.s = Math.min(e.w, e.s * Math.exp(-dt / tau(e)));
    e.state = e.s < 0.2 ? 'fade' : e.s < 0.45 ? 'blur' : 'clear';
  }
  db.lastDecay = t;
}

// ---- 1. 收集聊天文本 ----
const cutoff = now() - HOURS * 3600 * 1000;
const texts = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name.endsWith('.jsonl')) readJsonl(p);
  }
}
function readJsonl(p) {
  let raw;
  try { raw = fs.readFileSync(p, 'utf8'); } catch { return; }
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    if (o.time && o.time < cutoff) continue;
    if (o.type === 'user/message') {
      for (const c of o.data?.content ?? []) if (c.type === 'text') texts.push(c.text);
    } else if (o.type === 'assistant/message') {
      for (const c of o.data?.message?.content ?? []) if (c.type === 'text') texts.push(c.text);
    }
  }
}
walk(SESS);

const norm = (s) => s.replace(/<[^>]+>/g, ' ').replace(/[^\u4e00-\u9fa5A-Za-z0-9]+/g, ' ');
const spoken = norm(texts.join('\n'));
const spokenDense = spoken.replace(/\s+/g, '');

if (spokenDense.length < 50) {
  const msg = `[${new Date().toLocaleString('zh-CN')}] 最近 ${HOURS}h 没有可用对话文本，跳过。`;
  fs.appendFileSync(LOG, msg + '\n', 'utf8');
  console.log(msg);
  process.exit(0);
}

// ---- 2. 逐条对照 ----
const db = load();
applyDecay(db);

const CJK = /[\u4e00-\u9fa5]/;
const isCJK = (w) => [...w].every((c) => CJK.test(c));
const recalled = [];
for (const e of db.entries) {
  if (e.forgotten) continue; // 我刻意压成残影的，别被无意间提起来复活
  const t = norm(e.t).replace(/\s+/g, '');
  if (t.length < 3) continue;
  const hit3 = new Set(), hit4 = new Set();
  for (let i = 0; i + 3 <= t.length; i++) {
    const w = t.slice(i, i + 3);
    if (!isCJK(w)) continue;
    if (spokenDense.includes(w)) hit3.add(w);
  }
  for (let i = 0; i + 4 <= t.length; i++) {
    const w = t.slice(i, i + 4);
    if (!isCJK(w)) continue;
    if (spokenDense.includes(w)) hit4.add(w);
  }
  // 三字窗口太容易撞上「可以自己」这种口水话，要么有一个四字窗口，要么三字窗口够多
  if (hit3.size >= 3 || hit4.size >= 1) {
    if (!DRY) {
      e.hits += 1;
      e.last = now();
      e.decayedAt = now();
      e.s = Math.min(e.w, Math.max(e.s, 0.5) + 0.25);
      e.state = 'clear';
    }
    recalled.push({ id: e.id, t: e.t, words: [...hit4, ...hit3].slice(0, 4), s: e.s });
  }
}

if (!DRY) save(db);

const lines = [];
lines.push(`[${new Date().toLocaleString('zh-CN')}] 提起来了 ${recalled.length} 条（窗口 ${HOURS}h，文本 ${spokenDense.length} 字）${DRY ? ' [dry]' : ''}`);
for (const r of recalled) lines.push(`  ${r.id} ${r.t}  ← ${r.words.join('/')}`);
const out = lines.join('\n');
fs.appendFileSync(LOG, out + '\n', 'utf8');
console.log(out);
