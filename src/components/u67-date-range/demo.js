// U67 日期區間 — Date Range，兩次點選決定起訖並預覽區間
UILab.define(67, ({preset, doc, q, all, on, attrs, make, say}) => {
  const grid = q('.dr-grid'),
    title = q('.dr-title'),
    summary = q('.dr-summary');
  const DAY = 86400000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  let start = null,
    end = null,
    hover = null,
    focusDate = new Date(today);
  attrs(summary, {'aria-live': 'polite'});
  const fmt = d =>
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const same = (a, b) => !!a && !!b && a.getTime() === b.getTime();
  const days = (a, b) => Math.round((b - a) / DAY) + 1;
  const describe = () =>
    !start
      ? '請選擇開始日期'
      : !end
        ? '開始 ' + fmt(start) + '，請選擇結束日期'
        : fmt(start) + ' → ' + fmt(end) + '（' + days(start, end) + ' 天）';

  function draw(focus) {
    // Hover previews redraw the grid; keep keyboard focus on the same day when that happens.
    const hadFocus = grid.contains(doc.activeElement);
    grid.replaceChildren();
    title.textContent = view.getFullYear() + ' 年 ' + (view.getMonth() + 1) + ' 月';
    attrs(grid, {role: 'group', 'aria-label': title.textContent});
    ['日', '一', '二', '三', '四', '五', '六'].forEach(w => {
      const c = make('span', w, 'dr-wd');
      c.setAttribute('aria-hidden', 'true');
      grid.append(c);
    });
    for (let i = 0; i < view.getDay(); i++) grid.append(make('span'));
    if (focusDate.getMonth() !== view.getMonth() || focusDate.getFullYear() !== view.getFullYear())
      focusDate = new Date(view);
    const count = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const previewEnd = start && !end && hover ? hover : null;
    for (let d = 1; d <= count; d++) {
      const date = new Date(view.getFullYear(), view.getMonth(), d);
      const b = make('button', String(d), 'dr-day');
      b.type = 'button';
      b.tabIndex = same(date, focusDate) ? 0 : -1;
      const lo = previewEnd && previewEnd < start ? previewEnd : start;
      const hi = previewEnd ? (previewEnd < start ? start : previewEnd) : end;
      const isStart = same(date, start),
        isEnd = same(date, end);
      b.classList.toggle('today', same(date, today));
      b.classList.toggle('start', isStart || (!!previewEnd && same(date, lo)));
      b.classList.toggle('end', isEnd || (!!end && isStart && same(start, end)));
      b.classList.toggle('in-range', !!end && date > start && date < end);
      b.classList.toggle('preview', !!previewEnd && lo && hi && date > lo && date < hi);
      attrs(b, {
        'aria-label':
          fmt(date) +
          (isStart ? '，開始日' : '') +
          (isEnd ? '，結束日' : '') +
          (!!end && date > start && date < end ? '，區間內' : ''),
        'aria-pressed': isStart || isEnd,
      });
      on(b, 'click', () => pick(date));
      on(b, 'pointerenter', () => {
        if (start && !end && !same(hover, date)) {
          hover = date;
          draw();
        }
      });
      on(b, 'keydown', e => {
        const step = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7}[e.key];
        if (step) {
          e.preventDefault();
          move(step);
        } else if (e.key === 'PageUp' || e.key === 'PageDown') {
          e.preventDefault();
          shift(e.key === 'PageDown' ? 1 : -1, true);
        } else if (e.key === 'Escape' && start && !end) {
          e.preventDefault();
          start = hover = null;
          draw('.dr-day[tabindex="0"]');
          summary.textContent = describe();
        }
      });
      grid.append(b);
    }
    if (focus || hadFocus) grid.querySelector(focus || '.dr-day[tabindex="0"]')?.focus();
  }
  function move(step) {
    focusDate = new Date(focusDate.getTime() + step * DAY);
    if (focusDate.getMonth() !== view.getMonth()) view = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
    if (start && !end) hover = new Date(focusDate);
    draw('.dr-day[tabindex="0"]');
  }
  function shift(dir, keepFocus) {
    const d = focusDate.getDate();
    view = new Date(view.getFullYear(), view.getMonth() + dir, 1);
    focusDate = new Date(
      view.getFullYear(),
      view.getMonth(),
      Math.min(d, new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()),
    );
    draw(keepFocus ? '.dr-day[tabindex="0"]' : null);
  }
  function pick(date) {
    focusDate = new Date(date);
    if (!start || end) {
      start = date;
      end = hover = null;
    } else {
      [start, end] = date < start ? [date, start] : [start, date];
      hover = null;
    }
    draw('.dr-day[tabindex="0"]');
    summary.textContent = describe();
    say(describe());
  }
  function set(a, b) {
    start = a;
    end = b;
    hover = null;
    if (a) {
      view = new Date(b.getFullYear(), b.getMonth(), 1);
      focusDate = new Date(b);
    }
    draw();
    summary.textContent = describe();
  }
  all('.dr-nav').forEach(b => on(b, 'click', () => shift(Number(b.dataset.dir))));
  all('[data-preset]').forEach(b =>
    on(b, 'click', () => {
      const p = b.dataset.preset;
      if (p === '7') set(new Date(today.getTime() - 6 * DAY), new Date(today));
      if (p === 'month')
        set(new Date(today.getFullYear(), today.getMonth(), 1), new Date(today.getFullYear(), today.getMonth() + 1, 0));
      if (p === 'clear') set(null, null);
      say(describe());
    }),
  );
  on(grid, 'pointerleave', () => {
    if (hover) {
      hover = null;
      draw();
    }
  });
  if (preset === 'selected') set(new Date(today.getTime() - 6 * DAY), new Date(today));
  else if (preset === 'partial') {
    start = new Date(today.getFullYear(), today.getMonth(), Math.min(today.getDate(), 10));
    draw();
    summary.textContent = describe();
  } else set(null, null);
});
