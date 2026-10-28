#!/usr/bin/env node
// UI LAB build — zero dependencies (Node 18+).
//   node build.mjs           → dist/ui-lab-minimal.html
//   node build.mjs --check   → validate sources only, write nothing
import {readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const read = (...p) => readFileSync(join(...p), 'utf8');

/* ───────────────────────── CSS helpers ───────────────────────── */

// Minimal CSS parser: top-level rules, at-rule groups (@media/@supports/@container/@layer)
// with children, and opaque at-rule blocks (@keyframes/@font-face). Comments are dropped.
export function parseCss(text) {
  let i = 0;
  const n = text.length;
  function skipWsComments() {
    for (;;) {
      while (i < n && /\s/.test(text[i])) i++;
      if (text.startsWith('/*', i)) {
        const e = text.indexOf('*/', i + 2);
        i = e < 0 ? n : e + 2;
        continue;
      }
      return;
    }
  }
  function readUntil(stops) {
    // returns text up to (not incl.) a stop char at depth 0, skipping strings/comments
    let out = '',
      depth = 0;
    while (i < n) {
      const c = text[i];
      if (text.startsWith('/*', i)) {
        const e = text.indexOf('*/', i + 2);
        i = e < 0 ? n : e + 2;
        continue;
      }
      if (c === '"' || c === "'") {
        const s = i;
        i++;
        while (i < n && text[i] !== c) {
          if (text[i] === '\\') i++;
          i++;
        }
        i++;
        out += text.slice(s, i);
        continue;
      }
      if (c === '(') depth++;
      if (c === ')') depth--;
      if (depth === 0 && stops.includes(c)) return out;
      out += c;
      i++;
    }
    return out;
  }
  function readBlock() {
    // at '{', returns inner raw text, leaves i after matching '}'
    let depth = 0,
      start = i + 1;
    while (i < n) {
      const c = text[i];
      if (text.startsWith('/*', i)) {
        const e = text.indexOf('*/', i + 2);
        i = e < 0 ? n : e + 2;
        continue;
      }
      if (c === '"' || c === "'") {
        i++;
        while (i < n && text[i] !== c) {
          if (text[i] === '\\') i++;
          i++;
        }
        i++;
        continue;
      }
      if (c === '{') depth++;
      if (c === '}') {
        depth--;
        if (depth === 0) {
          const inner = text.slice(start, i);
          i++;
          return inner;
        }
      }
      i++;
    }
    return text.slice(start);
  }
  const GROUP = /^@(media|supports|container|layer|document)\b/i;
  function parseList(end) {
    const nodes = [];
    for (;;) {
      skipWsComments();
      if (i >= end) return nodes;
      const prelude = readUntil(['{', ';']).trim();
      if (i >= n) {
        if (prelude) nodes.push({type: 'stmt', prelude});
        return nodes;
      }
      if (text[i] === ';') {
        i++;
        nodes.push({type: 'stmt', prelude});
        continue;
      }
      if (GROUP.test(prelude)) {
        const blockStart = i;
        const inner = readBlock();
        const sub = parseCss(inner);
        nodes.push({type: 'group', prelude, children: sub});
        void blockStart;
      } else {
        const body = readBlock().replace(/\/\*[\s\S]*?\*\//g, '');
        nodes.push({type: prelude.startsWith('@') ? 'atblock' : 'rule', prelude, body});
      }
    }
  }
  return parseList(n);
}

export function stringifyCss(nodes, indent = '') {
  return nodes
    .map(node => {
      if (node.type === 'stmt') return indent + node.prelude + ';';
      if (node.type === 'group')
        return indent + node.prelude + ' {\n' + stringifyCss(node.children, indent + '  ') + '\n' + indent + '}';
      return indent + node.prelude + ' {' + formatBody(node.body, indent) + '}';
    })
    .join('\n');
}
function formatBody(body, indent) {
  const trimmed = body.trim();
  if (!trimmed) return '';
  if (trimmed.includes('{')) return '\n' + indent + '  ' + trimmed + '\n' + indent; // keyframes keep inner text
  return ' ' + trimmed + ' ';
}

// Split selector list at top-level commas.
export function splitSelectors(prelude) {
  const out = [];
  let depth = 0,
    cur = '';
  for (const c of prelude) {
    if (c === '(' || c === '[') depth++;
    if (c === ')' || c === ']') depth--;
    if (c === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
// Classes a selector requires (contents of :not() are not required).
export function requiredClasses(selector) {
  let s = selector.replace(/\[[^\]]*\]/g, '');
  let prev;
  do {
    prev = s;
    s = s.replace(/:not\((?:[^()]|\([^()]*\))*\)/g, '');
  } while (s !== prev);
  return [...s.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].map(m => m[1]);
}
export function animationNames(body) {
  const names = new Set();
  for (const m of body.matchAll(/animation(?:-name)?\s*:\s*([^;}]+)/g))
    for (const tok of m[1].split(/[\s,]+/)) if (/^[A-Za-z_][\w-]*$/.test(tok)) names.add(tok);
  return names;
}

// Flatten parsed CSS into self-contained chunks (each rule wrapped in its group preludes).
export function toChunks(nodes, wrap = []) {
  const chunks = [];
  for (const node of nodes) {
    if (node.type === 'group') {
      chunks.push(...toChunks(node.children, [...wrap, node.prelude]));
      continue;
    }
    let css = node.type === 'stmt' ? node.prelude + ';' : node.prelude + ' {' + formatBody(node.body, '') + '}';
    for (let k = wrap.length - 1; k >= 0; k--) css = wrap[k] + ' {\n  ' + css.replace(/\n/g, '\n  ') + '\n}';
    const keyframes = /^@(-webkit-)?keyframes\s+([\w-]+)/i.exec(node.prelude)?.[2] || null;
    const selectors = node.type === 'rule' ? splitSelectors(node.prelude).map(requiredClasses) : null;
    const inner = node.type === 'stmt' ? node.prelude + ';' : node.prelude + ' {' + formatBody(node.body, '') + '}';
    chunks.push({
      css,
      inner,
      wrap: wrap.join(' » '),
      wraps: [...wrap],
      keyframes,
      selectors,
      animations: node.body ? animationNames(node.body) : new Set(),
    });
  }
  return chunks;
}

// Class names a component can produce: class="" in markup + tokens in JS string literals.
export function classesIn(markup, js, knownClasses) {
  const found = new Set();
  for (const m of markup.matchAll(/class="([^"]*)"/g))
    m[1]
      .split(/\s+/)
      .filter(Boolean)
      .forEach(c => found.add(c));
  for (const m of js.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
    const str = m[1] ?? m[2] ?? m[3] ?? '';
    for (const t of str.matchAll(/-?[A-Za-z_][\w-]*/g)) {
      const tok = t[0];
      if (tok.endsWith('-')) {
        for (const k of knownClasses) if (k.startsWith(tok)) found.add(k);
      } else found.add(tok);
    }
  }
  return found;
}
export function chunkNeeded(chunk, classes) {
  if (!chunk.selectors) return !chunk.keyframes; // stmt / at-blocks other than keyframes are global
  return chunk.selectors.some(req => req.every(c => classes.has(c)));
}

/* ───────────────────────── design tokens ───────────────────────── */

// Reads every custom property in tokens.css, keyed by the selector variant it belongs to.
export function tokenSets(css) {
  const sets = {};
  for (const node of parseCss(css)) {
    if (node.type !== 'rule') continue;
    const sel = node.prelude.replace(/\s+/g, ' ').trim();
    const variant = /^:root$/.test(sel)
      ? 'base'
      : sel
          .match(/data-([\w-]+)=['"]?([\w-]+)/)
          ?.slice(1)
          .join(':');
    if (!variant) continue;
    for (const m of node.body.matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g))
      (sets[variant] ??= {})[m[1]] = m[2].replace(/\s+/g, ' ').trim();
  }
  return sets;
}

const TOKEN_GROUPS = [
  {
    title: '表面與文字',
    kind: 'color',
    match: n =>
      [
        '--bg',
        '--panel',
        '--panel-2',
        '--line',
        '--line-2',
        '--text',
        '--text-dim',
        '--accent',
        '--accent-2',
        '--on-accent',
        '--scrim',
      ].includes(n),
  },
  {title: '語意色', kind: 'color', match: n => ['--ok', '--err', '--warn', '--star'].includes(n)},
  {title: '分類色', kind: 'color', match: n => n.startsWith('--cat-')},
  {title: '圓角', kind: 'radius', match: n => ['--radius', '--radius-s', '--pill'].includes(n)},
  {title: '間距', kind: 'space', match: n => n.startsWith('--space-')},
  {title: '陰影', kind: 'shadow', match: n => n.startsWith('--shadow-')},
  {title: '字體', kind: 'font', match: n => ['--sans', '--mono', '--font-scale'].includes(n)},
  {title: '動態時間', kind: 'motion', match: n => n.startsWith('--motion-')},
];
const VARIANT_LABEL = {'mode:dark': '深', 'density:compact': '精簡', 'corners:square': '方角', 'corners:round': '圓角'};

function tokensHtml(sets) {
  const names = [...new Set(Object.values(sets).flatMap(s => Object.keys(s)))];
  const used = new Set();
  const groups = TOKEN_GROUPS.map(g => ({...g, names: names.filter(n => !used.has(n) && g.match(n) && used.add(n))}));
  const rest = names.filter(n => !used.has(n));
  if (rest.length) groups.push({title: '其他', kind: 'text', names: rest});
  const valueOf = (name, variant) => sets[variant]?.[name];
  const card = (name, kind) => {
    const base = valueOf(name, 'base');
    const variants = Object.keys(VARIANT_LABEL).filter(v => valueOf(name, v) !== undefined);
    const values = [
      base !== undefined ? (kind === 'color' ? '淺 ' : '') + base : null,
      ...variants.map(v => VARIANT_LABEL[v] + ' ' + valueOf(name, v)),
    ].filter(Boolean);
    let preview = '';
    if (kind === 'color') {
      const dark = valueOf(name, 'mode:dark') ?? base;
      preview = `<span class="token-swatch" aria-hidden="true"><i style="background:${esc(base)}"></i><i style="background:${esc(dark)}"></i></span>`;
    } else if (kind === 'radius')
      preview = `<span class="token-radius" style="border-radius:var(${name})" aria-hidden="true"></span>`;
    else if (kind === 'space')
      preview = `<span class="token-space" aria-hidden="true"><i style="width:var(${name})"></i></span>`;
    else if (kind === 'shadow')
      preview = `<span class="token-shadow" style="box-shadow:var(${name})" aria-hidden="true"></span>`;
    else if (kind === 'font')
      preview =
        name === '--font-scale'
          ? `<span class="token-font" aria-hidden="true">× ${esc(base)}</span>`
          : `<span class="token-font" style="font-family:var(${name})" aria-hidden="true">Aa 永</span>`;
    else if (kind === 'motion')
      preview = `<span class="token-motion" style="--d:var(${name})" aria-hidden="true"><i></i></span>`;
    return `<div class="token-card">${preview}<button type="button" class="token-name" data-copy="var(${name})" aria-label="複製 var(${name})">${name}</button><span class="token-values">${values.map(v => `<span>${esc(v)}</span>`).join('')}</span></div>`;
  };
  return `<section class="token-section" id="design-tokens" aria-labelledby="tokens-title">
  <div class="token-head">
    <div>
      <span class="cat-num">// TOKENS</span>
      <h2 class="cat-title" id="tokens-title">設計變數 DESIGN TOKENS</h2>
      <p class="token-desc">所有元件只透過這些變數取得顏色與尺寸；深色模式、密度與圓角設定只切換變數值。點變數名稱可複製 var()。</p>
    </div>
    <div class="token-actions"><button type="button" class="catalog-button" data-token-download="css">下載 tokens.css</button><button type="button" class="catalog-button" data-token-download="json">下載 tokens.json</button></div>
  </div>
${groups
  .filter(g => g.names.length)
  .map(
    g =>
      `  <div class="token-group"><h3>${esc(g.title)}</h3><div class="token-grid token-${g.kind}">${g.names.map(n => card(n, g.kind)).join('')}</div></div>`,
  )
  .join('\n')}
  <p class="token-status" role="status" aria-live="polite"></p>
</section>`;
}

/* ───────────────────────── sources ───────────────────────── */

export function loadSources() {
  const categories = JSON.parse(read(SRC, 'categories.json'));
  const labels = JSON.parse(read(SRC, 'state-labels.json'));
  const dirs = readdirSync(join(SRC, 'components'), {withFileTypes: true})
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();
  const components = dirs.map(dir => {
    const base = join(SRC, 'components', dir);
    const meta = JSON.parse(read(base, 'component.json'));
    const opt = f => (existsSync(join(base, f)) ? read(base, f) : '');
    return {
      ...meta,
      dir,
      markup: read(base, 'markup.html').trim(),
      css: opt('style.css').trim(),
      js: read(base, 'demo.js').trim(),
    };
  });
  return {
    categories,
    labels,
    components,
    page: read(SRC, 'page.html'),
    tokens: read(SRC, 'styles', 'tokens.css'),
    base: read(SRC, 'styles', 'base.css'),
    overrides: read(SRC, 'styles', 'overrides.css'),
    pageCss: read(SRC, 'styles', 'page.css'),
    core: read(SRC, 'runtime', 'core.js'),
    styleBoot: read(SRC, 'app', 'style-settings.js'),
    app: ['catalog.js', 'inspector.js', 'tokens.js', 'workbench.js'].map(f => read(SRC, 'app', f)),
  };
}

export function validate({categories, labels, components}) {
  const errors = [];
  const cats = new Set(categories.map(c => c.key));
  const seen = new Map();
  for (const c of components) {
    const where = 'components/' + c.dir;
    for (const f of ['number', 'slug', 'title', 'desc', 'category', 'guide', 'states'])
      if (c[f] === undefined) errors.push(where + ': 缺少欄位 ' + f);
    if (!cats.has(c.category)) errors.push(where + ': 未知分類 ' + c.category);
    if (seen.has(c.number)) errors.push(where + ': 編號 U' + c.number + ' 與 ' + seen.get(c.number) + ' 重複');
    seen.set(c.number, c.dir);
    if (c.dir !== 'u' + String(c.number).padStart(2, '0') + '-' + c.slug)
      errors.push(where + ': 資料夾名稱應為 u' + String(c.number).padStart(2, '0') + '-' + c.slug);
    if (!new RegExp('UILab\\.define\\(\\s*' + c.number + '\\s*,').test(c.js))
      errors.push(where + ': demo.js 必須呼叫 UILab.define(' + c.number + ', …)');
    for (const s of c.states || [])
      if (!labels[s]) errors.push(where + ': 狀態「' + s + '」沒有出現在 state-labels.json');
    if (/\son[a-z]+=/i.test(c.markup))
      errors.push(where + ': markup.html 不可使用 inline 事件（onclick 等），請在 demo.js 綁定');
    if (!c.guide?.use || !c.guide?.avoid) errors.push(where + ': guide 需要 use 與 avoid');
    const strings = v => Array.isArray(v) && v.length > 0 && v.every(x => typeof x === 'string' && x.trim());
    if (!strings(c.anatomy)) errors.push(where + ': anatomy 需要至少一項結構說明（字串陣列）');
    if (!strings(c.content)) errors.push(where + ': content 需要至少一條文案規則（字串陣列）');
    if (
      !Array.isArray(c.keyboard) ||
      !c.keyboard.length ||
      !c.keyboard.every(r => Array.isArray(r) && r.length === 2 && r.every(x => typeof x === 'string' && x.trim()))
    )
      errors.push(where + ': keyboard 需要 [按鍵, 動作] 組成的陣列');
    if (c.category === 'game' && (!strings(c.godot?.tree) || typeof c.godot?.notes !== 'string'))
      errors.push(where + ': 遊戲元件需要 godot.tree（節點樹）與 godot.notes（實作說明）');
  }
  return errors;
}

/* ───────────────────────── build ───────────────────────── */

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escScript = s => s.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

function cardHtml(c) {
  const id = 'u' + c.number + '-' + c.slug,
    label = 'U' + c.number;
  const body = c.markup
    .split('\n')
    .map(line => '      ' + line)
    .join('\n');
  return `  <div class="module" id="${id}" data-demo="${c.number}" tabindex="-1">
    <div class="module-head"><span class="module-id">${label}</span><span class="module-title">${esc(c.title)}</span></div>
    <p class="module-desc">${esc(c.desc)}</p>
    <div class="module-body">
${body}
    </div>
    <details class="module-guide"><summary>使用規範</summary><dl class="guide-list"><dt class="use">適用</dt><dd>${esc(c.guide.use)}</dd><dt class="avoid">避免</dt><dd>${esc(c.guide.avoid)}</dd></dl></details>
    <div class="module-tools"><a href="#${id}" aria-label="定位 ${label} ${esc(c.title)}">定位 ${label}</a><button type="button" class="catalog-button" data-action="copy-link" aria-label="複製 ${label} ${esc(c.title)} 的連結">複製連結</button><button type="button" class="catalog-button" data-action="reset" aria-label="重設 ${label} 示範">重設</button><button type="button" class="catalog-button" data-action="inspect" aria-label="檢視 ${label} 狀態與程式碼">狀態與程式碼</button></div>
  </div>`;
}

export function build({write = true} = {}) {
  const src = loadSources();
  const errors = validate(src);
  if (errors.length) {
    console.error('✗ 來源檢查失敗：\n  ' + errors.join('\n  '));
    process.exit(1);
  }
  const comps = [...src.components].sort((a, b) => a.number - b.number);

  // Shared CSS is emitted as separable chunks so exports can include only what a component uses.
  const baseChunks = toChunks(parseCss(src.base));
  const overChunks = toChunks(parseCss(src.overrides));
  const known = new Set();
  for (const text of [src.base, src.overrides, ...comps.map(c => c.css)])
    for (const m of text.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) known.add(m[1]);
  const coreClasses = classesIn('', src.core, known);
  ['module', 'module-head', 'module-id', 'module-title', 'module-desc', 'module-body'].forEach(c => coreClasses.add(c));
  const manifestComps = comps.map(c => {
    const classes = new Set([...coreClasses, ...classesIn(c.markup, c.js, known)]);
    const need = baseChunks.map(ch => chunkNeeded(ch, classes));
    const needOver = overChunks.map(ch => chunkNeeded(ch, classes));
    const anims = new Set();
    baseChunks.forEach((ch, k) => {
      if (need[k]) ch.animations.forEach(a => anims.add(a));
    });
    overChunks.forEach((ch, k) => {
      if (needOver[k]) ch.animations.forEach(a => anims.add(a));
    });
    for (const a of animationNames(c.css)) anims.add(a);
    baseChunks.forEach((ch, k) => {
      if (ch.keyframes && anims.has(ch.keyframes)) need[k] = true;
    });
    return {
      n: c.number,
      slug: c.slug,
      title: c.title,
      desc: c.desc,
      cat: c.category,
      aliases: c.aliases || '',
      use: c.guide.use,
      avoid: c.guide.avoid,
      states: c.states,
      note: c.note || '',
      anatomy: c.anatomy,
      keyboard: c.keyboard,
      content: c.content,
      godot: c.godot || null,
      base: need.flatMap((v, k) => (v ? [k] : [])),
      over: needOver.flatMap((v, k) => (v ? [k] : [])),
    };
  });

  const counts = Object.fromEntries(
    src.categories.map(cat => [cat.key, comps.filter(c => c.category === cat.key).length]),
  );
  const sections = src.categories
    .map((cat, k) => {
      const list = comps.filter(c => c.category === cat.key);
      return `<section class="cat-section" id="cat-${cat.key}" data-cat="${cat.key}">
  <div class="cat-header">
    <span class="cat-num">// ${String(k + 1).padStart(2, '0')}</span>
    <h2 class="cat-title">${esc(cat.name)} ${esc(cat.en)}</h2>
    <span class="cat-desc">${esc(cat.desc)}</span>
    <span class="cat-count">${list.length} MODULES</span>
  </div>
  <div class="cat-grid">
${list.map(cardHtml).join('\n')}
  </div>
</section>`;
    })
    .join('\n\n');
  const chips = src.categories
    .map(
      cat =>
        `<a class="index-chip" href="#cat-${cat.key}" data-cat="${cat.key}"><i style="background:var(--cat-${cat.key});"></i>${esc(cat.name)} <span class="n">· ${counts[cat.key]}</span></a>`,
    )
    .join('\n    ');
  const options = src.categories
    .map(cat => `<option value="${cat.key}">${esc(cat.name)}</option>`)
    .join('\n          ');
  const catColors = src.categories.map(cat => `#cat-${cat.key}{--cat-color:var(--cat-${cat.key});}`).join('\n');

  const tokens = tokenSets(src.tokens);
  const manifest = {
    version: src.page.match(/name="uilab-version" content="([^"]+)"/)?.[1] || '',
    labels: src.labels,
    categories: src.categories.map(c => ({key: c.key, name: c.name})),
    tokens,
    components: manifestComps,
  };
  const head = [
    `<style id="uilab-tokens">\n${src.tokens.trim()}\n</style>`,
    `<style id="uilab-base">\n${baseChunks.map(c => c.css).join('\n/*@*/\n')}\n</style>`,
    ...comps.filter(c => c.css).map(c => `<style data-component="${c.number}">\n${c.css}\n</style>`),
    `<style id="uilab-overrides">\n${overChunks.map(c => c.css).join('\n/*@*/\n')}\n</style>`,
    `<style id="uilab-page">\n${src.pageCss.trim()}\n${catColors}\n</style>`,
    `<script id="uilab-style-settings">\n${escScript(src.styleBoot.trim())}\n</script>`,
  ].join('\n');
  const scripts = [
    `<script type="application/json" id="uilab-manifest">${escScript(JSON.stringify(manifest))}</script>`,
    `<script id="uilab-core">\n${escScript(src.core.trim())}\n</script>`,
    ...comps.map(c => `<script data-component="${c.number}">\n${escScript(c.js)}\n</script>`),
    ...src.app.map(js => `<script>\n${escScript(js.trim())}\n</script>`),
  ].join('\n');
  const html = src.page
    .replace('<!--@head-->', () => head)
    .replace('<!--@count-->', () => String(comps.length))
    .replace('<!--@chips-->', () => chips)
    .replace('<!--@category-options-->', () => options)
    .replace('<!--@sections-->', () => sections)
    .replace('<!--@tokens-->', () => tokensHtml(tokens))
    .replace('<!--@scripts-->', () => scripts);
  const leftover = html.match(/<!--@[\w-]+-->/);
  if (leftover) {
    console.error('✗ page.html 有未處理的佔位符 ' + leftover[0]);
    process.exit(1);
  }
  if (write) {
    mkdirSync(join(ROOT, 'dist'), {recursive: true});
    writeFileSync(join(ROOT, 'dist', 'ui-lab-minimal.html'), html);
  }
  const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
  console.log(
    `✓ ${comps.length} 個元件、${src.categories.length} 個分類、共用 CSS ${baseChunks.length}+${overChunks.length} 段 → dist/ui-lab-minimal.html（${kb} KB）`,
  );
  return html;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  build({write: !process.argv.includes('--check')});
