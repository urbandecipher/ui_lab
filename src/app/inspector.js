// 掛載所有元件，並提供「重設」與「狀態與程式碼」檢視器（即時預覽 + 匯出）。
// 匯出只組合：設計變數 + 該元件用到的共用樣式 + 元件樣式 + 核心執行環境 + 元件程式。
(() => {
  const root = document.documentElement;
  const manifest = JSON.parse(document.getElementById('uilab-manifest').textContent);
  const byNumber = new Map(manifest.components.map(c => [c.n, c]));
  const labels = manifest.labels;
  document.getElementById('modeToggle').addEventListener('click', () => window.UILabStyle.toggle());

  // Export sources are read from the built page itself, so an export always matches what is on screen.
  const tokensCss = document.getElementById('uilab-tokens').textContent.trim();
  const baseChunks = document
    .getElementById('uilab-base')
    .textContent.split('/*@*/')
    .map(s => s.trim());
  const overChunks = document
    .getElementById('uilab-overrides')
    .textContent.split('/*@*/')
    .map(s => s.trim());
  const coreJs = document.getElementById('uilab-core').textContent.trim();
  const own = (tag, n) => document.querySelector(tag + '[data-component="' + n + '"]')?.textContent.trim() || '';

  const entries = [...document.querySelectorAll('.module[data-demo]')].map(card => {
    const number = Number(card.dataset.demo);
    const meta = byNumber.get(number);
    const clone = card.cloneNode(true);
    clone.querySelector('.module-tools')?.remove();
    clone.querySelector('.module-guide')?.remove();
    clone.removeAttribute('hidden');
    clone.removeAttribute('tabindex');
    clone.id = 'export-root';
    const template = clone.outerHTML;
    let dispose = mountDemo(card, number);
    const reset = card.querySelector('[data-action="reset"]');
    const inspect = card.querySelector('[data-action="inspect"]');
    reset.addEventListener('click', () => {
      dispose();
      const clean = document.createElement('template');
      clean.innerHTML = template;
      card.querySelector('.module-body').replaceWith(clean.content.querySelector('.module-body'));
      card.querySelector('.demo-live')?.remove();
      dispose = mountDemo(card, number);
      reset.focus();
      card.querySelector('.demo-live').textContent = '此示範已重設';
    });
    const entry = {number, meta, template, inspect};
    inspect.addEventListener('click', () => openInspector(entry));
    return entry;
  });

  const escapeScript = value => value.replace(/<\/script/gi, '<\\/script');
  function bundle(entry, state) {
    const {number, meta} = entry;
    const html = entry.template;
    const appearance = Object.fromEntries(
      ['mode', 'font', 'density', 'corners', 'motion'].map(name => [name, root.dataset[name]]),
    );
    const style = [
      '/* 設計變數 */\n' + tokensCss,
      '/* 共用樣式（僅此元件用到的部分） */\n' + meta.base.map(i => baseChunks[i]).join('\n'),
      own('style', number) && '/* U' + number + ' 元件樣式 */\n' + own('style', number),
      meta.over.length && '/* 共用覆寫（外觀設定等） */\n' + meta.over.map(i => overChunks[i]).join('\n'),
      '/* 匯出頁面 */\n' +
        window.UILabStyle.css() +
        '\nbody{padding:24px;min-height:100vh;}\n#export-root{max-width:560px;margin:0 auto;--cat-color:var(--cat-' +
        meta.cat +
        ');}',
    ]
      .filter(Boolean)
      .join('\n\n');
    const js = [
      'Object.assign(document.documentElement.dataset, ' + JSON.stringify(appearance) + ');',
      coreJs,
      own('script', number),
      '// 同一頁可放多個實例：對每個容器呼叫 mountDemo(容器, ' +
        number +
        ')，ID 會自動加上前綴。\nmountDemo(document.getElementById("export-root"), ' +
        number +
        ', ' +
        JSON.stringify(state) +
        ');',
    ].join('\n\n');
    const full =
      '<!DOCTYPE html>\n<html lang="zh-Hant" ' +
      window.UILabStyle.attributes() +
      '>\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>U' +
      number +
      ' ' +
      meta.title +
      '</title>\n<style>\n' +
      style +
      '\n</style>\n</head>\n<body>\n' +
      html +
      '\n<scr' +
      'ipt>\n' +
      escapeScript(js) +
      '\n</scr' +
      'ipt>\n</body>\n</html>';
    return {HTML: html, CSS: style, JavaScript: js, '完整 HTML': full};
  }

  function openInspector(entry) {
    const {number, meta} = entry;
    const dialog = document.createElement('dialog');
    dialog.className = 'inspector';
    dialog.setAttribute('aria-labelledby', 'inspectorTitle');
    dialog.innerHTML =
      '<div class="inspector-head"><h2 id="inspectorTitle"></h2><button type="button" class="catalog-button" aria-label="關閉元件詳情">關閉</button></div><div class="inspector-content"><section><label for="demoState">狀態預覽</label><select id="demoState"></select><div class="inspector-guide"><dl class="guide-list"><dt class="use">適用</dt><dd></dd><dt class="avoid">避免</dt><dd></dd></dl></div><p class="inspector-note" id="stateNote"></p><iframe title="互動元件預覽" sandbox="allow-scripts"></iframe><p class="inspector-note">預覽可操作。切換狀態會重新初始化；匯出使用所選狀態，不包含預覽中的臨時操作。</p></section><section><div class="source-tabs" role="tablist" aria-label="程式碼格式"></div><label for="demoSource">程式碼</label><textarea id="demoSource" readonly spellcheck="false" wrap="off"></textarea><p class="inspector-note">完整 HTML 可離線開啟，無外部套件，只包含此元件用到的樣式與程式。分開取用時，先放入 HTML 與 CSS，再於元件後載入 JavaScript；同一頁可放多個實例，ID 會自動加上前綴。</p><div class="inspector-actions"><button type="button" class="catalog-button" id="copySource">複製目前程式碼</button><button type="button" class="catalog-button" id="downloadSource">下載完整 HTML</button></div><p class="inspector-status" role="status" aria-live="polite"></p></section></div>';
    const title = dialog.querySelector('h2'),
      select = dialog.querySelector('select'),
      iframe = dialog.querySelector('iframe');
    const source = dialog.querySelector('textarea'),
      tabs = dialog.querySelector('.source-tabs'),
      status = dialog.querySelector('.inspector-status');
    title.textContent = 'U' + number + ' · ' + meta.title;
    const dds = dialog.querySelectorAll('.inspector-guide dd');
    dds[0].textContent = meta.use;
    dds[1].textContent = meta.avoid;
    dialog.querySelector('#stateNote').textContent =
      meta.note || '可用滑鼠、觸控或鍵盤操作。狀態選單列出此元件適用的狀態。';
    ['default', ...meta.states, 'disabled'].forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = labels[value];
      select.append(option);
    });
    let format = 'HTML',
      current = bundle(entry, 'default');
    function renderCode() {
      source.value = current[format];
      source.setAttribute('aria-label', format + ' 程式碼');
      [...tabs.children].forEach(el => {
        const active = el.textContent === format;
        el.setAttribute('aria-selected', active);
        el.tabIndex = active ? 0 : -1;
        if (active) source.setAttribute('aria-labelledby', el.id);
      });
    }
    ['HTML', 'CSS', 'JavaScript', '完整 HTML'].forEach((label, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'catalog-button';
      b.textContent = label;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', 'sourcePanel');
      b.id = 'sourceTab' + i;
      b.addEventListener('click', () => {
        format = label;
        renderCode();
      });
      b.addEventListener('keydown', e => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault();
        const next = e.key === 'Home' ? 0 : e.key === 'End' ? 3 : (i + (e.key === 'ArrowRight' ? 1 : 3)) % 4;
        tabs.children[next].click();
        tabs.children[next].focus();
      });
      tabs.append(b);
    });
    // The code field itself is the tab panel so the tab list remains outside it.
    source.setAttribute('role', 'tabpanel');
    source.id = 'sourcePanel';
    dialog.querySelector('label[for="demoSource"]').htmlFor = source.id;
    function refresh() {
      current = bundle(entry, select.value);
      const keep = document.activeElement === select;
      // A preset that auto-opens a menu inside the preview must not pull focus away from the state selector.
      iframe.onload = () => {
        if (keep)
          [0, 80, 250].forEach(ms =>
            setTimeout(() => {
              if (document.activeElement === iframe) select.focus({preventScroll: true});
            }, ms),
          );
      };
      iframe.srcdoc = current['完整 HTML'];
      status.textContent = '';
      renderCode();
    }
    select.addEventListener('change', refresh);
    dialog.querySelector('#copySource').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(current[format]);
        status.textContent = '已複製 ' + format + ' 程式碼';
      } catch {
        source.focus();
        source.select();
        status.textContent = '瀏覽器未允許自動複製，已選取程式碼，請手動複製。';
      }
    });
    dialog.querySelector('#downloadSource').addEventListener('click', () => {
      const url = URL.createObjectURL(new Blob([current['完整 HTML']], {type: 'text/html;charset=utf-8'}));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ui-lab-u' + number + '-' + select.value + '.html';
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = '已建立完整 HTML 下載';
    });
    dialog.querySelector('.inspector-head button').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      iframe.srcdoc = '';
      dialog.remove();
      entry.inspect.focus({preventScroll: true});
    });
    document.body.append(dialog);
    refresh();
    dialog.showModal();
    select.focus();
  }
  void entries;
})();
