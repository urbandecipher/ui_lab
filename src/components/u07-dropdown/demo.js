// U7 下拉選單 — Dropdown，自訂樣式選單
UILab.define(7, ({preset, uid, doc, q, all, on, text, attrs, button}) => {
  const wrap = q('#dropdown'),
    trigger = q('.dd-trigger'),
    menu = q('.dd-menu'),
    items = all('.dd-menu div');
  menu.id = uid('options');
  attrs(menu, {role: 'listbox', 'aria-label': '排序方式'});
  const close = () => {
    wrap.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    items.forEach(el => (el.tabIndex = -1));
  };
  const open = () => {
    wrap.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    items[0].focus();
  };
  button(trigger, '排序方式', () => (wrap.classList.contains('open') ? close() : open()));
  attrs(trigger, {'aria-haspopup': 'listbox', 'aria-controls': menu.id, 'aria-expanded': false});
  items.forEach((el, i) => {
    button(el, null, () => {
      text('#ddValue', el.textContent);
      items.forEach(it => it.setAttribute('aria-selected', it === el));
      close();
      trigger.focus();
    });
    attrs(el, {role: 'option', tabindex: -1, 'aria-selected': false});
    on(el, 'keydown', e => {
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
        items[
          e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? items.length - 1
              : (i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length
        ].focus();
      }
    });
  });
  on(trigger, 'keydown', e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      open();
    }
  });
  on(wrap, 'keydown', e => {
    if (e.key === 'Escape') {
      close();
      trigger.focus();
    }
  });
  on(doc, 'pointerdown', e => {
    if (!wrap.contains(e.target)) close();
  });
  on(wrap, 'focusout', e => {
    if (!wrap.contains(e.relatedTarget)) close();
  });
  if (preset === 'selected') items[1].click();
  if (preset === 'expanded') open();
});
