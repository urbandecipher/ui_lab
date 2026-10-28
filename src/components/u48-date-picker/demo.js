// U48 日期選擇器 — Date Picker，月曆彈出與鍵盤導覽
UILab.define(48, ({preset, uid, doc, q, on, later, text, attrs, make, say}) => {
  const wrap = q('.datepick'),
    trigger = q('.date-trigger'),
    pop = q('.date-pop');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let view = new Date(today.getFullYear(), today.getMonth(), 1),
    selected = null,
    focusDate = new Date(today);
  pop.id = uid('date-pop');
  attrs(pop, {role: 'dialog', 'aria-label': '選擇日期'});
  attrs(trigger, {
    'aria-haspopup': 'dialog',
    'aria-controls': pop.id,
    'aria-expanded': false,
    'aria-label': '選擇日期',
  });
  const fmt = d =>
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const same = (a, b) => !!a && !!b && a.getTime() === b.getTime();
  const inView = d => d.getMonth() === view.getMonth() && d.getFullYear() === view.getFullYear();
  function draw(focusSel) {
    pop.replaceChildren();
    const head = make('div', undefined, 'date-head'),
      prev = make('button', '‹', 'date-nav'),
      next = make('button', '›', 'date-nav'),
      title = make('span', view.getFullYear() + ' 年 ' + (view.getMonth() + 1) + ' 月', 'date-title');
    prev.type = next.type = 'button';
    attrs(prev, {'aria-label': '上個月'});
    attrs(next, {'aria-label': '下個月'});
    title.setAttribute('aria-live', 'polite');
    head.append(prev, title, next);
    on(prev, 'click', () => shift(-1, '[aria-label="上個月"]'));
    on(next, 'click', () => shift(1, '[aria-label="下個月"]'));
    const grid = make('div', undefined, 'date-grid');
    attrs(grid, {role: 'group', 'aria-label': title.textContent});
    ['日', '一', '二', '三', '四', '五', '六'].forEach(w => {
      const c = make('span', w, 'date-wd');
      c.setAttribute('aria-hidden', 'true');
      grid.append(c);
    });
    for (let i = 0; i < view.getDay(); i++) grid.append(make('span', '', 'date-pad'));
    if (!inView(focusDate)) focusDate = new Date(view);
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const date = new Date(view.getFullYear(), view.getMonth(), d),
        b = make('button', String(d), 'date-day');
      b.type = 'button';
      b.tabIndex = same(date, focusDate) ? 0 : -1;
      attrs(b, {'aria-label': fmt(date) + (same(date, today) ? '（今天）' : ''), 'aria-pressed': same(date, selected)});
      b.classList.toggle('today', same(date, today));
      b.classList.toggle('selected', same(date, selected));
      on(b, 'click', () => {
        selected = date;
        focusDate = new Date(date);
        text('.date-value', fmt(date));
        close();
        say('已選擇 ' + fmt(date));
      });
      on(b, 'keydown', e => {
        const step = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7}[e.key];
        if (step) {
          e.preventDefault();
          move(step);
        }
        if (e.key === 'PageUp' || e.key === 'PageDown') {
          e.preventDefault();
          const n = new Date(focusDate);
          n.setMonth(n.getMonth() + (e.key === 'PageDown' ? 1 : -1));
          focusDate = n;
          view = new Date(n.getFullYear(), n.getMonth(), 1);
          draw('.date-day[tabindex="0"]');
        }
      });
      grid.append(b);
    }
    pop.append(head, grid);
    if (focusSel) pop.querySelector(focusSel)?.focus();
  }
  function move(step) {
    const n = new Date(focusDate);
    n.setDate(n.getDate() + step);
    focusDate = n;
    if (!inView(n)) view = new Date(n.getFullYear(), n.getMonth(), 1);
    draw('.date-day[tabindex="0"]');
  }
  function shift(dir, sel) {
    view = new Date(view.getFullYear(), view.getMonth() + dir, 1);
    focusDate = new Date(view);
    draw(sel);
  }
  function open() {
    if (selected) {
      focusDate = new Date(selected);
      view = new Date(selected.getFullYear(), selected.getMonth(), 1);
    }
    pop.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    draw('.date-day[tabindex="0"]');
  }
  function close(focus = true) {
    if (pop.hidden) return;
    pop.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (focus) trigger.focus();
  }
  on(trigger, 'click', () => (pop.hidden ? open() : close()));
  on(pop, 'keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  });
  on(doc, 'pointerdown', e => {
    if (!wrap.contains(e.target)) close(false);
  });
  on(wrap, 'focusout', e => {
    if (e.relatedTarget && !wrap.contains(e.relatedTarget)) close(false);
  });
  if (preset === 'selected') {
    selected = new Date(today);
    selected.setDate(selected.getDate() + 3);
    text('.date-value', fmt(selected));
  }
  if (preset === 'expanded') later(open, 0);
});
