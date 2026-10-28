// U51 麵包屑 — Breadcrumb，階層路徑與過長收合
UILab.define(51, ({root, preset, q, on, make, say, control}) => {
  const ol = q('.crumbs ol');
  let trail =
      preset === 'long'
        ? ['首頁', '產品', '電子配件', '音訊設備', '耳機', '無線耳機']
        : ['首頁', '產品', '電子配件', '無線耳機'],
    collapsed = true;
  const extra = ['規格', '評論', '常見問題', '保固'];
  const render = focusLast => {
    ol.replaceChildren();
    const indexes =
      trail.length > 4 && collapsed ? [0, -1, trail.length - 2, trail.length - 1] : trail.map((_, i) => i);
    indexes.forEach(i => {
      const li = make('li');
      if (i === -1) {
        const more = make('button', '…', 'crumb-more');
        more.type = 'button';
        more.setAttribute('aria-label', '顯示被收合的 ' + (trail.length - 3) + ' 層');
        on(more, 'click', () => {
          collapsed = false;
          render();
          ol.querySelectorAll('a')[1]?.focus();
        });
        li.append(more);
      } else if (i === trail.length - 1) {
        const cur = make('span', trail[i]);
        cur.setAttribute('aria-current', 'page');
        li.append(cur);
      } else {
        const a = make('a', trail[i]);
        a.href = '#' + root.id;
        on(a, 'click', e => {
          e.preventDefault();
          trail = trail.slice(0, i + 1);
          collapsed = true;
          render(true);
          say('已返回「' + trail[i] + '」');
        });
        li.append(a);
      }
      ol.append(li);
    });
    if (focusLast) {
      const links = ol.querySelectorAll('a');
      (links[links.length - 1] || ol.querySelector('button'))?.focus();
    }
  };
  const deeper = control(
    '前往下一層',
    () => {
      trail.push(extra[trail.length % extra.length]);
      collapsed = true;
      render();
      say('目前位置：' + trail[trail.length - 1]);
      deeper.disabled = trail.length >= 8;
    },
    q('.crumbs-wrap'),
  );
  render();
});
