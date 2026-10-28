// U69 搜尋框 — Search Field，清除按鈕、Esc 清空與最近搜尋
UILab.define(69, ({preset, uid, q, on, attrs, make, say}) => {
  const ARTICLES = [
    '設計系統入門',
    '無障礙表單設計',
    '深色模式配色',
    '按鈕文案指南',
    '表單驗證時機',
    '動畫與減少動態',
    '資料表格設計',
    '行動版導覽',
    '空狀態設計',
    '設計變數命名',
    '鍵盤操作規範',
    '色彩對比檢查',
  ];
  const MAX_RECENT = 5;
  const form = q('.sf'),
    input = q('.sf-input'),
    clear = q('.sf-clear'),
    result = q('.sf-result'),
    recentBox = q('.sf-recent'),
    recentList = q('.sf-recent-list');
  let recent = [];
  input.id = uid('sf-input');
  q('.sf-label').htmlFor = input.id;
  attrs(clear, {'aria-label': '清除搜尋文字'});
  attrs(result, {role: 'status'});
  recentList.setAttribute('aria-label', '最近搜尋');

  const renderClear = () => (clear.hidden = !input.value);
  function renderRecent() {
    recentList.replaceChildren();
    recentBox.hidden = !recent.length;
    recent.forEach(term => {
      const li = make('li');
      const again = make('button', term);
      again.type = 'button';
      again.setAttribute('aria-label', '再次搜尋 ' + term);
      on(again, 'click', () => {
        input.value = term;
        renderClear();
        search(term);
      });
      const remove = make('button', '×', 'sf-remove');
      remove.type = 'button';
      remove.setAttribute('aria-label', '從紀錄移除 ' + term);
      on(remove, 'click', () => {
        recent = recent.filter(t => t !== term);
        renderRecent();
        (recentList.querySelector('button') || input).focus();
        say('已移除 ' + term);
      });
      li.append(again, remove);
      recentList.append(li);
    });
  }
  function search(term) {
    const hits = ARTICLES.filter(a => a.includes(term));
    result.textContent = hits.length
      ? '「' + term + '」找到 ' + hits.length + ' 筆：' + hits.slice(0, 3).join('、') + (hits.length > 3 ? '…' : '')
      : '找不到「' + term + '」，試試較短的關鍵字';
    recent = [term, ...recent.filter(t => t !== term)].slice(0, MAX_RECENT);
    renderRecent();
  }
  on(form, 'submit', e => {
    e.preventDefault();
    const term = input.value.trim();
    if (term) search(term);
  });
  on(input, 'input', renderClear);
  on(input, 'keydown', e => {
    if (e.key === 'Escape' && input.value) {
      e.preventDefault();
      input.value = '';
      result.textContent = '';
      renderClear();
      say('已清除搜尋文字');
    }
  });
  on(clear, 'click', () => {
    input.value = '';
    result.textContent = '';
    renderClear();
    input.focus();
  });
  on(q('.sf-clear-all'), 'click', () => {
    recent = [];
    renderRecent();
    input.focus();
    say('已清除搜尋紀錄');
  });
  recent = ['表單', '深色模式'];
  if (preset === 'filled') {
    input.value = '設計';
    search('設計');
  }
  if (preset === 'empty') {
    input.value = '量子';
    search('量子');
  }
  renderClear();
  renderRecent();
});
