// 圖鑑：搜尋、分類篩選、數量統計、複製連結與「重設全部示範」。
// 元件資料來自建置時產生的 #uilab-manifest，不需要在這裡維護任何清單。
(() => {
  const manifest = JSON.parse(document.getElementById('uilab-manifest').textContent);
  const meta = new Map(manifest.components.map(c => [c.n, c]));
  const search = document.getElementById('catalogSearch');
  const category = document.getElementById('catalogCategory');
  const status = document.getElementById('catalogStatus');
  const sections = [...document.querySelectorAll('.cat-section')];
  const cards = [...document.querySelectorAll('.module[data-demo]')];
  const scopeButtons = [...document.querySelectorAll('[data-scope]')];
  const resetKey = 'ui-lab-reset:' + location.pathname;
  let scope = 'all';

  const normalize = text => text.normalize('NFKC').toLocaleLowerCase().trim();
  const records = cards.map(card => {
    const m = meta.get(Number(card.dataset.demo));
    const id = 'U' + m.n;
    const copy = card.querySelector('[data-action="copy-link"]');
    copy.addEventListener('click', async () => {
      const url = new URL(location.href);
      url.hash = card.id;
      try {
        await navigator.clipboard.writeText(url.href);
        status.textContent = '已複製 ' + id + ' ' + m.title + ' 的連結';
      } catch {
        showLink(url.href, copy);
      }
    });
    return {card, cat: m.cat, text: normalize([id, m.title, m.desc, m.aliases, m.use].join(' ')), id: normalize(id)};
  });

  const countOf = cat =>
    records.filter(r => cat === 'all' || (cat === 'general' ? r.cat !== 'game' : r.cat === cat)).length;
  document.getElementById('heroCount').textContent = cards.length;
  document.querySelectorAll('.index-chip[data-cat]').forEach(chip => {
    chip.querySelector('.n').textContent = '· ' + countOf(chip.dataset.cat);
  });
  scopeButtons.forEach(button => {
    button.textContent = button.dataset.label + ' ' + countOf(button.dataset.scope);
  });

  const empty = document.createElement('div');
  empty.className = 'catalog-empty';
  empty.hidden = true;
  empty.innerHTML =
    '<strong>沒有符合的元件</strong><p>試試較短的關鍵字，或清除搜尋與分類條件。</p><button type="button" class="catalog-button">清除篩選，顯示全部</button>';
  document.getElementById('catalogMain').append(empty);
  empty.querySelector('button').addEventListener('click', () => {
    clear();
    search.focus();
  });

  function render() {
    const terms = normalize(search.value).split(/\s+/).filter(Boolean);
    let count = 0;
    records.forEach(record => {
      const visible =
        (scope === 'all' || (scope === 'game' ? record.cat === 'game' : record.cat !== 'game')) &&
        (category.value === 'all' || category.value === record.cat) &&
        terms.every(term => (/^u\d+$/.test(term) ? term === record.id : record.text.includes(term)));
      record.card.hidden = !visible;
      if (visible) count++;
    });
    sections.forEach(section => {
      const list = [...section.querySelectorAll('.module')];
      const visible = list.filter(card => !card.hidden).length;
      section.hidden = visible === 0;
      section.querySelector('.cat-count').textContent =
        visible === list.length ? list.length + ' MODULES' : visible + ' / ' + list.length + ' MODULES';
    });
    scopeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scope === scope)));
    status.textContent = '顯示 ' + count + ' / ' + cards.length + ' 個元件';
    empty.hidden = count !== 0;
  }
  function clear() {
    search.value = '';
    category.value = 'all';
    scope = 'all';
    render();
  }

  search.addEventListener('input', render);
  category.addEventListener('change', () => {
    if (category.value === 'game') scope = 'game';
    else if (category.value !== 'all') scope = 'general';
    render();
  });
  scopeButtons.forEach(button =>
    button.addEventListener('click', () => {
      scope = button.dataset.scope;
      // A scope switch starts with all its categories, avoiding contradictory filters.
      category.value = 'all';
      render();
    }),
  );
  document.getElementById('catalogClear').addEventListener('click', () => {
    clear();
    search.focus();
  });
  document.querySelectorAll('.index-chip').forEach(link => link.addEventListener('click', clear));

  function revealHash() {
    let hash;
    try {
      hash = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    const target = document.getElementById(hash);
    if (!target || !(target.classList.contains('module') || target.classList.contains('cat-section'))) return;
    if (target.hidden || target.closest('.cat-section')?.hidden) clear();
    requestAnimationFrame(() => {
      target.scrollIntoView({block: 'start'});
      if (target.classList.contains('module')) target.focus({preventScroll: true});
    });
  }
  window.addEventListener('hashchange', revealHash);

  document.getElementById('catalogReset').addEventListener('click', () => {
    const state = {
      query: search.value,
      category: category.value,
      scope,
      mode: document.documentElement.dataset.mode || 'light',
      y: scrollY,
      time: Date.now(),
    };
    // Reload clears every original timer, animation and event closure reliably.
    try {
      sessionStorage.setItem(resetKey, JSON.stringify(state));
    } catch {
      window.name = 'ui-lab-reset:' + JSON.stringify({...state, previousName: window.name});
    }
    location.reload();
  });
  let restored = null;
  try {
    restored = JSON.parse(sessionStorage.getItem(resetKey) || 'null');
    sessionStorage.removeItem(resetKey);
  } catch {}
  if (window.name.startsWith('ui-lab-reset:')) {
    try {
      restored = JSON.parse(window.name.slice(13));
      window.name = restored.previousName || '';
    } catch {}
  }
  if (restored && Date.now() - restored.time < 30000) {
    search.value = restored.query;
    category.value = restored.category;
    scope = restored.scope;
    document.documentElement.dataset.mode = restored.mode;
    render();
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        window.scrollTo({top: restored.y, behavior: 'instant'});
        document.getElementById('catalogReset').focus({preventScroll: true});
        status.textContent += ' · 全部示範已重設';
      }),
    );
  } else {
    render();
    revealHash();
  }

  function showLink(url, trigger) {
    const overlay = document.createElement('div');
    overlay.className = 'link-fallback';
    overlay.innerHTML =
      '<div class="link-fallback-box" role="dialog" aria-modal="true" aria-labelledby="copyLinkTitle"><h3 id="copyLinkTitle">複製元件連結</h3><p>瀏覽器未允許自動複製，請手動複製下方連結。</p><input aria-label="元件連結" readonly><button type="button" class="catalog-button">完成</button></div>';
    const input = overlay.querySelector('input');
    const close = overlay.querySelector('button');
    const siblings = [...document.body.children].filter(el => el.tagName !== 'SCRIPT');
    const inertState = siblings.map(el => el.inert);
    siblings.forEach(el => (el.inert = true));
    function dismiss() {
      overlay.remove();
      siblings.forEach((el, i) => (el.inert = inertState[i]));
      trigger.focus();
    }
    close.addEventListener('click', dismiss);
    overlay.addEventListener('click', event => {
      if (event.target === overlay) dismiss();
    });
    overlay.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        (document.activeElement === input ? close : input).focus();
      }
    });
    input.value = url;
    document.body.append(overlay);
    input.focus();
    input.select();
  }
})();
