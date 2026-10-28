// U71 選單按鈕 — Menu Button，按鈕開啟操作選單（含勾選項、分隔線、停用項）
UILab.define(71, ({preset, uid, doc, q, all, on, later, text, attrs, make, say}) => {
  const wrap = q('.mb'),
    trigger = q('.mb-trigger'),
    menu = q('.mb-menu');
  menu.id = uid('mb-menu');
  trigger.id = uid('mb-trigger');
  attrs(trigger, {'aria-haspopup': 'menu', 'aria-expanded': false, 'aria-controls': menu.id});
  attrs(menu, {role: 'menu', 'aria-labelledby': trigger.id});
  const items = [];
  all('.mb-menu li').forEach(li => {
    if (li.hasAttribute('data-separator')) return li.setAttribute('role', 'separator');
    const checkable = li.hasAttribute('data-check');
    attrs(li, {role: checkable ? 'menuitemcheckbox' : 'menuitem', tabindex: -1});
    if (checkable) {
      li.setAttribute('aria-checked', li.dataset.check);
      const tick = make('span', li.dataset.check === 'true' ? '✓' : '', 'mb-tick');
      tick.setAttribute('aria-hidden', 'true');
      li.prepend(tick);
    }
    if (li.hasAttribute('data-disabled')) li.setAttribute('aria-disabled', 'true');
    items.push(li);
  });
  const isOpen = () => !menu.hidden;
  function open(where = 'first') {
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    // Disabled items stay focusable so users learn the feature exists.
    (where === 'last' ? items[items.length - 1] : items[0]).focus();
  }
  function close(focus = true) {
    if (!isOpen()) return;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (focus) trigger.focus();
  }
  function activate(li) {
    if (li.getAttribute('aria-disabled') === 'true') return say(li.textContent + '：目前無法使用');
    if (li.getAttribute('role') === 'menuitemcheckbox') {
      const next = li.getAttribute('aria-checked') !== 'true';
      li.setAttribute('aria-checked', next);
      li.querySelector('.mb-tick').textContent = next ? '✓' : '';
      text('.mb-log', (next ? '已顯示' : '已隱藏') + '封存項目');
      say((next ? '已勾選 ' : '已取消 ') + li.textContent.replace('✓', '').trim());
      return; // checkbox items keep the menu open
    }
    text('.mb-log', '已執行：' + li.textContent.trim() + '（示範）');
    close();
  }
  on(trigger, 'click', () => (isOpen() ? close() : open()));
  on(trigger, 'keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      open(e.key === 'ArrowUp' ? 'last' : 'first');
    }
  });
  items.forEach(li => on(li, 'click', () => activate(li)));
  on(menu, 'keydown', e => {
    const i = items.indexOf(doc.activeElement);
    const go = n => items[(n + items.length) % items.length].focus();
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(items.length - 1);
    else if (e.key === 'Enter' || e.key === ' ') activate(items[i]);
    else if (e.key === 'Escape') close();
    else if (e.key === 'Tab') return close(false);
    else if (e.key.length === 1 && /\S/.test(e.key)) {
      // Type-ahead: jump to the next item starting with the typed character.
      const order = [...items.slice(i + 1), ...items.slice(0, i + 1)];
      order.find(li => li.textContent.trim().replace(/^✓/, '').startsWith(e.key))?.focus();
    } else return;
    e.preventDefault();
  });
  on(doc, 'pointerdown', e => !wrap.contains(e.target) && close(false));
  if (preset === 'expanded') later(() => open(), 0);
});
