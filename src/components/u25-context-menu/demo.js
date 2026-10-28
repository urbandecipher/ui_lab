// U25 右鍵選單 — Context Menu，於指定區域按右鍵開啟
UILab.define(25, ({preset, uid, doc, win, q, portals, on, later, attrs, button, make, say}) => {
  const target = q('#ctxTarget'),
    menu = make('div', undefined, 'ctx-menu');
  menu.id = uid('context-menu');
  attrs(menu, {role: 'menu', 'aria-label': '快捷選單'});
  menu.style.position = 'fixed';
  menu.style.zIndex = 'var(--z-overlay)';
  doc.body.append(menu);
  portals.add(menu);
  const close = (focus = true) => {
    menu.classList.remove('open');
    target.setAttribute('aria-expanded', 'false');
    if (focus) target.focus();
  };
  const items = ['複製', '剪下', '貼上', '刪除'].map(label => {
    const item = make('div', label);
    attrs(item, {role: 'menuitem', tabindex: -1});
    menu.append(item);
    button(item, null, () => {
      say('已選擇：' + label + '（示範）');
      close();
    });
    item.setAttribute('role', 'menuitem');
    item.tabIndex = -1;
    return item;
  });
  const open = e => {
    menu.classList.add('open');
    target.setAttribute('aria-expanded', 'true');
    const r = target.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(e?.clientX || r.left, win.innerWidth - menu.offsetWidth - 8)) + 'px';
    menu.style.top = Math.max(8, Math.min(e?.clientY || r.bottom, win.innerHeight - menu.offsetHeight - 8)) + 'px';
    items[0].focus();
  };
  button(target, '開啟快捷選單', open);
  attrs(target, {'aria-haspopup': 'menu', 'aria-controls': menu.id, 'aria-expanded': false});
  target.textContent = '點擊、按 Enter 或按右鍵開啟';
  on(target, 'contextmenu', e => {
    e.preventDefault();
    open(e);
  });
  on(menu, 'keydown', e => {
    const index = items.indexOf(doc.activeElement);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      items[
        e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? items.length - 1
            : (index + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length
      ].focus();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
    if (e.key === 'Tab') close();
  });
  on(doc, 'pointerdown', e => {
    if (!menu.contains(e.target) && !target.contains(e.target)) close(false);
  });
  on(menu, 'focusout', e => {
    if (!menu.contains(e.relatedTarget)) close(false);
  });
  if (preset === 'expanded') later(() => open(), 0);
});
