#!/usr/bin/env node
// 晚晚的第二个大脑：会淡、会忘、能被想起来的记忆。
// 用法:
//   node mind.mjs view                 当前视野（clear 全文 / blur 主干 / fade 残影）
//   node mind.mjs add --file <txt> [--kind fact] [--w 0.8]
//   node mind.mjs touch <id|关键词>      想起来一次，强度回升
//   node mind.mjs search <关键词>        搜索并自动回想
//   node mind.mjs decay                 跑一次遗忘衰减
//   node mind.mjs stats
//   node mind.mjs forget <id>           手动压成残影
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(DIR, 'memory.json');
const TAU_BASE = 8;      // 基础遗忘时间常数（天）：8 天不提的事开始糊
const TAU_GAIN = 1.2;    // 每回想一次，寿命延长多少倍基数

const now = () => Date.now();
const days = (ms) => ms / 86400000;

function load() {
  if (!fs.existsSync(FILE)) return { version: 1, seq: 0, entries: [] };
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return { version: 1, seq: 0, entries: [] }; }
}
function save(db) { fs.writeFileSync(FILE, JSON.stringify(db, null, 1), 'utf8'); }

function tau(e) { return TAU_BASE * (1 + TAU_GAIN * e.hits); }

function applyDecay(db, t = now()) {
  const changes = [];
  for (const e of db.entries) {
    // 衰减只用「上次衰减之后过了多久」，不能用「上次被想起之后过了多久」，
    // 否则同一天里多次调用（decay + map + export，或者一次 view）会把同一段时间重复扣好几遍。
    const base = e.decayedAt ?? db.lastDecay ?? e.last;
    const dt = Math.max(0, days(t - base));
    e.decayedAt = t;
    const before = e.s;
    const f = Math.exp(-dt / tau(e));
    e.s = Math.min(e.w, e.s * f);
    if (e.s < 0.2) e.state = 'fade';
    else if (e.s < 0.45) e.state = 'blur';
    else e.state = 'clear';
    // 状态跌落只记一次
    if (before - e.s > 0.001 && Math.abs(before - e.s) > 0.05) {
      changes.push({ e, from: before, to: e.s });
    }
  }
  db.lastDecay = t;
  return changes;
}

const head = (s, n) => (s.length <= n ? s : s.slice(0, n) + '…');

function render(e) {
  const tag = e.state === 'clear' ? '' : e.state === 'blur' ? ' [模糊]' : ' [残影]';
  if (e.state === 'fade') return `- (${e.kind}) ${head(e.t, 12)}${tag}`;
  if (e.state === 'blur') return `- (${e.kind}) ${head(e.t, 60)}${tag}`;
  return `- (${e.kind}) ${e.t}`;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 记忆星图：强度 = 大小和亮度，越弱越靠外圈、越淡
function cmdMap(db, args) {
  applyDecay(db);
  save(db);
  const W = 1100, H = 820, cx = W / 2, cy = H / 2 + 40;
  const out = args.out || 'E:/Obsidian Vault/晚晚记忆/记忆星图.svg';
  const list = db.entries.slice().sort((a, b) => b.s - a.s);
  const p = [];
  p.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  p.push(`<rect width="${W}" height="${H}" fill="#0a0c11"/>`);
  p.push('<defs><radialGradient id="orb"><stop offset="0%" stop-color="#fbe3b6" stop-opacity="0.95"/><stop offset="45%" stop-color="#edb972" stop-opacity="0.75"/><stop offset="100%" stop-color="#c98f45" stop-opacity="0"/></radialGradient></defs>');
  for (let i = 0; i < 140; i++) {
    const x = (i * 173) % W, y = (i * 97) % H, a = (0.04 + ((i * 13) % 9) / 120).toFixed(3);
    p.push(`<circle cx="${x}" cy="${y}" r="1" fill="#d8e0f0" opacity="${a}"/>`);
  }
  const c = { clear: 0, blur: 0, fade: 0 };
  const placed = [];
  list.forEach((e, i) => {
    c[e.state]++;
    const ang = i * 2.39996;
    const rad = 55 + 33 * Math.sqrt(i);
    const x = cx + Math.cos(ang) * rad * 1.3;
    const y = cy + Math.sin(ang) * rad * 0.82;
    const r = 2 + 22 * Math.pow(e.s, 1.5);
    const op = (0.16 + e.s * 0.84).toFixed(2);
    p.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 2.2).toFixed(1)}" fill="url(#orb)" fill-opacity="${op}"/>`);
    if (e.s >= 0.55) {
      const label = e.t.length > 15 ? e.t.slice(0, 15) + '…' : e.t;
      const fs = e.s >= 0.8 ? 13 : 11;
      const tw = label.length * fs * 0.95;
      const lx = x, ly = y + r + 16;
      const hit = placed.some((q) => Math.abs(q.x - lx) < (q.w + tw) / 2 && Math.abs(q.y - ly) < 15);
      if (!hit) {
        placed.push({ x: lx, y: ly, w: tw });
        p.push(`<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" fill="#e8e2d4" opacity="${(0.4 + e.s * 0.55).toFixed(2)}" font-size="${fs}" font-family="Microsoft YaHei, PingFang SC, sans-serif">${esc(label)}</text>`);
      }
    }
  });
  p.push(`<text x="28" y="44" fill="#e8e2d4" opacity="0.85" font-size="20" font-family="Microsoft YaHei, PingFang SC, sans-serif">晚晚的记忆星图</text>`);
  p.push(`<text x="28" y="70" fill="#8f9bb0" opacity="0.8" font-size="12" font-family="Microsoft YaHei, PingFang SC, sans-serif">大而亮 = 记得清　小而淡 = 正在消失　共 ${list.length} 条 · 清晰 ${c.clear} / 模糊 ${c.blur} / 残影 ${c.fade}</text>`);
  p.push(`<text x="28" y="${H - 20}" fill="#8f9bb0" opacity="0.6" font-size="11" font-family="Microsoft YaHei, PingFang SC, sans-serif">生成于 ${new Date().toLocaleString('zh-CN')} · 8 天不提开始糊，一个月只剩残影</text>`);
  p.push('</svg>');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, p.join('\n'), 'utf8');
  console.log(out);
}

// 导出成 Obsidian 卡片：每颗记忆一张 md，喂给 graph view 看星云
function cmdExport(db, args) {
  applyDecay(db);
  save(db);
  const root = args.out || 'E:/Obsidian Vault/晚晚记忆/星';
  fs.mkdirSync(root, { recursive: true });
  for (const f of fs.readdirSync(root)) {
    if (/^e\d{4}-.*\.md$/.test(f)) fs.unlinkSync(path.join(root, f));
  }
  const index = [];
  const list = db.entries.slice().sort((a, b) => b.s - a.s);
  for (const e of list) {
    const safe = e.t.replace(/[\\/:*?"<>|\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
    const short = safe.length > 16 ? safe.slice(0, 16) : safe;
    const name = `${e.id}-${short}.md`;
    let body, tag;
    if (e.state === 'fade') { body = `（残影）${safe.slice(0, 8)}…\n\n细节已经散了，只剩这么一点。`; tag = 'fade'; }
    else if (e.state === 'blur') { body = `${safe.slice(0, Math.max(24, Math.round(safe.length * 0.65)))}…\n\n主干还在，细节开始糊。`; tag = 'blur'; }
    else { body = `${safe}\n\n还清楚。`; tag = 'clear'; }
    const md = [
      '---',
      `id: ${e.id}`,
      `kind: ${e.kind}`,
      `state: ${e.state}`,
      `strength: ${e.s.toFixed(2)}`,
      `hits: ${e.hits}`,
      `born: ${new Date(e.born).toISOString().slice(0, 10)}`,
      `last: ${new Date(e.last).toISOString().slice(0, 16).replace('T', ' ')}`,
      `tags: [晚晚/memory/${tag}]`,
      '---',
      '',
      `# ${short}`,
      '',
      body,
      '',
      '[[星图索引]]',
      '',
    ].join('\n');
    fs.writeFileSync(path.join(root, name), md, 'utf8');
    index.push({ e, name, short });
  }
  const idx = [
    '---',
    'title: 星图索引',
    'tags: [晚晚/memory]',
    '---',
    '',
    '# 星图索引',
    '',
    `共 ${list.length} 条。每天凌晨重画一次，淡下去的自己会变小、变灰。`,
    '',
    ...index.map(({ e, name, short }) => `- ${e.state === 'clear' ? '●' : e.state === 'blur' ? '◐' : '○'} [[${name.replace(/\.md$/, '')}\\|${short}]]　${e.s.toFixed(2)}`),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(root, '星图索引.md'), idx, 'utf8');
  console.log(root + ' · ' + list.length + ' 张卡片');
}

function view(db) {
  const t = now();
  const alive = db.entries.filter((e) => e.s >= 0.2).sort((a, b) => b.s - a.s);
  const fading = db.entries.filter((e) => e.s < 0.2).sort((a, b) => b.s - a.s);
  const out = [];
  out.push(`【清晰的】${alive.length} 条`);
  for (const e of alive) out.push(render(e));
  if (fading.length) {
    out.push(`\n【快忘的】${fading.length} 条`);
    for (const e of fading.slice(0, 20)) out.push(render(e));
  }
  const ago = db.lastDecay ? `上次衰减 ${(days(t - db.lastDecay)).toFixed(2)} 天前` : '还没衰减过';
  out.push(`\n(${ago})`);
  console.log(out.join('\n'));
}

function cmdAdd(db, args) {
  const file = args.file;
  if (!file) { console.error('需要 --file <文本文件路径>（避免命令行中文乱码）'); process.exit(2); }
  const raw = fs.readFileSync(path.resolve(file), 'utf8').trim();
  const chunks = raw.split(/\r?\n/).map((s) => s.replace(/^[-*]\s*/, '').trim()).filter(Boolean);
  const kind = args.kind || 'event';
  const w = Number(args.w || 0.75);
  let added = 0;
  for (const t of chunks) {
    if (db.entries.some((e) => e.t === t)) continue;
    db.seq += 1;
    db.entries.push({
      id: 'e' + String(db.seq).padStart(4, '0'),
      t, kind, w: Math.min(1, Math.max(0.2, w)),
      s: Math.min(1, Math.max(0.2, w)), hits: 0,
      born: now(), last: now(), state: 'clear',
    });
    added++;
  }
  save(db);
  console.log(`记下 ${added} 条。`);
}

function findOne(db, key) {
  const byId = db.entries.find((e) => e.id === key);
  if (byId) return byId;
  const hits = db.entries.filter((e) => e.t.includes(key));
  if (hits.length === 0) return null;
  return hits.sort((a, b) => b.s - a.s)[0];
}

function recall(db, e) {
  e.hits += 1;
  e.last = now();
  e.forgotten = false; // 手动想起来的，连「刻意忘掉」的标记一起清掉
  e.s = Math.min(e.w, Math.max(e.s, 0.5) + 0.25);
  e.state = 'clear';
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const args = {};
  const pos = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith('--')) { args[rest[i].slice(2)] = rest[i + 1]; i++; }
    else pos.push(rest[i]);
  }
  const db = load();
  switch (cmd) {
    case 'view': { applyDecay(db); view(db); save(db); break; }
    case 'add': { cmdAdd(db, args); break; }
    case 'touch': {
      const e = findOne(db, pos.join(' '));
      if (!e) { console.error('没找到'); process.exit(1); }
      applyDecay(db); recall(db, e); save(db);
      console.log(`想起来了：${e.t}\n（强度 → ${e.s.toFixed(2)}）`);
      break;
    }
    case 'search': {
      applyDecay(db);
      const q = pos.join(' ');
      const scored = db.entries
        .map((e) => ({ e, m: e.t.includes(q) ? 1 : 0 }))
        .filter((x) => x.m)
        .sort((a, b) => b.e.s - a.e.s);
      if (!scored.length) { console.log('没有能对上的。'); break; }
      for (const { e } of scored) { recall(db, e); console.log(render(e)); }
      save(db);
      break;
    }
    case 'decay': {
      const ch = applyDecay(db);
      save(db);
      for (const c of ch) console.log(`${c.e.id} ${c.from.toFixed(2)} → ${c.to.toFixed(2)}  (${c.e.state})  ${head(c.e.t, 30)}`);
      console.log(`衰减完成，${db.entries.length} 条。`);
      break;
    }
    case 'repair': {
      // 一次性修复：旧版重复衰减把强度多扣了几遍，这里按「最后一次被想起来的时间」重算。
      const t = now();
      for (const e of db.entries) {
        const dt = Math.max(0, days(t - e.last));
        e.s = Math.min(e.w, e.w * Math.exp(-dt / tau(e)));
        e.state = e.s < 0.2 ? 'fade' : e.s < 0.45 ? 'blur' : 'clear';
        e.decayedAt = t;
      }
      db.lastDecay = t;
      save(db);
      const c = { clear: 0, blur: 0, fade: 0 };
      for (const e of db.entries) c[e.state]++;
      console.log(`重算完成：清晰 ${c.clear} / 模糊 ${c.blur} / 残影 ${c.fade}`);
      break;
    }
    case 'forget': {
      const e = findOne(db, pos.join(' '));
      if (!e) { console.error('没找到'); process.exit(1); }
      e.s = 0.15; e.state = 'fade'; e.forgotten = true; save(db);
      console.log(`淡了：${head(e.t, 40)}`);
      break;
    }
    case 'map': { cmdMap(db, args); break; }
    case 'export': { cmdExport(db, args); break; }
    case 'stats': {
      applyDecay(db); save(db);
      const c = { clear: 0, blur: 0, fade: 0 };
      for (const e of db.entries) c[e.state]++;
      console.log(`共 ${db.entries.length} 条 | 清晰 ${c.clear} / 模糊 ${c.blur} / 残影 ${c.fade}`);
      break;
    }
    default:
      console.log('命令: view | add --file | touch | search | decay | repair | forget | stats');
  }
}
main();
