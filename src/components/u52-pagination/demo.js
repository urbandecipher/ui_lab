// U52 分頁器 — Pagination，頁碼省略與上下頁
UILab.define(52, ({preset, q, on, text, make, say}) => {
  const nav = q('.pager'),
    total = 12,
    per = 10;
  let page = preset === 'last' ? total : 1;
  const pages = () => {
    const list = [
        ...new Set(
          [
            1,
            total,
            page - 1,
            page,
            page + 1,
            page <= 3 ? 2 : 0,
            page <= 3 ? 3 : 0,
            page >= total - 2 ? total - 1 : 0,
            page >= total - 2 ? total - 2 : 0,
          ].filter(n => n >= 1 && n <= total),
        ),
      ].sort((a, b) => a - b),
      out = [];
    list.forEach((n, i) => {
      if (i && n - list[i - 1] > 1) out.push(0);
      out.push(n);
    });
    return out;
  };
  const go = (n, cls) => {
    page = Math.max(1, Math.min(total, n));
    render();
    say('第 ' + page + ' 頁，共 ' + total + ' 頁');
    const keep = cls && nav.querySelector('.' + cls);
    (keep && !keep.disabled ? keep : nav.querySelector('[aria-current="page"]')).focus();
  };
  const mk = (label, n, aria, disabled, cls) => {
    const b = make('button', label, 'pager-btn' + (cls ? ' ' + cls : ''));
    b.type = 'button';
    b.setAttribute('aria-label', aria);
    b.disabled = disabled;
    on(b, 'click', () => go(n, cls));
    return b;
  };
  const render = () => {
    nav.replaceChildren(mk('‹', page - 1, '上一頁', page === 1, 'pager-prev'));
    pages().forEach(n => {
      if (!n) {
        const gap = make('span', '…', 'pager-gap');
        gap.setAttribute('aria-hidden', 'true');
        nav.append(gap);
        return;
      }
      const b = mk(String(n), n, '第 ' + n + ' 頁', false);
      if (n === page) {
        b.setAttribute('aria-current', 'page');
        b.classList.add('current');
      }
      nav.append(b);
    });
    nav.append(mk('›', page + 1, '下一頁', page === total, 'pager-next'));
    text('.pager-info', '第 ' + ((page - 1) * per + 1) + '–' + page * per + ' 筆，共 ' + total * per + ' 筆');
  };
  render();
});
