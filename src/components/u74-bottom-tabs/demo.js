// U74 底部分頁列 — Bottom Tab Bar，手機主要導覽，圖示一律搭配文字
UILab.define(74, ({preset, all, on, text, make, say}) => {
  const items = all('.bt-item');
  function go(item, announce) {
    items.forEach(b => b.removeAttribute('aria-current'));
    item.setAttribute('aria-current', 'page');
    text('.bt-title', item.dataset.page);
    text('.bt-desc', item.dataset.desc);
    if (item.dataset.page === '訊息' && item.dataset.badge) {
      delete item.dataset.badge;
      item.querySelector('.bt-badge')?.remove();
      item.removeAttribute('aria-label');
    }
    if (announce) say('已切換到' + item.dataset.page);
  }
  items.forEach(item => {
    if (item.dataset.badge) {
      const badge = make('span', item.dataset.badge, 'bt-badge');
      badge.setAttribute('aria-hidden', 'true');
      item.append(badge);
      item.setAttribute('aria-label', item.dataset.page + '，' + item.dataset.badge + ' 則未讀');
    }
    on(item, 'click', () => go(item, true));
  });
  go(items[preset === 'selected' ? 2 : 0], false);
});
