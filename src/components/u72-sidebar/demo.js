// U72 可收合側欄 — Collapsible Sidebar，收合後只顯示圖示並保留名稱
UILab.define(72, ({preset, uid, q, all, on, attrs, say}) => {
  const root = q('.sb'),
    collapse = q('.sb-collapse'),
    toggle = q('.sb-toggle'),
    sub = q('.sb-sub');
  sub.id = uid('sb-sub');
  attrs(toggle, {'aria-expanded': false, 'aria-controls': sub.id});
  let collapsed = false;
  const links = all('a.sb-link');
  function setCollapsed(next) {
    collapsed = next;
    root.classList.toggle('collapsed', collapsed);
    collapse.setAttribute('aria-expanded', !collapsed);
    collapse.querySelector('.sb-label').textContent = collapsed ? '展開側欄' : '收合側欄';
    collapse.setAttribute('aria-label', collapsed ? '展開側欄' : '收合側欄');
    // When labels are hidden, names move to aria-label and a native tooltip.
    [...links, toggle].forEach(el => {
      const name = el.querySelector('.sb-label').textContent;
      if (collapsed) attrs(el, {'aria-label': name, title: name});
      else {
        el.removeAttribute('aria-label');
        el.removeAttribute('title');
      }
    });
    if (collapsed) setGroup(false);
  }
  function setGroup(open) {
    toggle.setAttribute('aria-expanded', open);
    sub.hidden = !open;
  }
  function go(link) {
    links.forEach(l => l.removeAttribute('aria-current'));
    link.setAttribute('aria-current', 'page');
    q('.sb-page').textContent = '目前頁面：' + link.dataset.page;
  }
  on(collapse, 'click', () => {
    setCollapsed(!collapsed);
    say(collapsed ? '側欄已收合' : '側欄已展開');
  });
  on(toggle, 'click', () => {
    if (collapsed) {
      setCollapsed(false);
      return setGroup(true);
    }
    setGroup(sub.hidden);
  });
  links.forEach(link =>
    on(link, 'click', e => {
      e.preventDefault();
      go(link);
    }),
  );
  go(links[0]);
  if (preset === 'expanded') setGroup(true);
  if (preset === 'collapsed') setCollapsed(true);
  else setCollapsed(false);
});
