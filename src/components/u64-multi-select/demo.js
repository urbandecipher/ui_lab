// U64 多選下拉 — Multi-select，標籤顯示、輸入篩選、選取上限
UILab.define(64, ({preset, uid, doc, q, on, later, attrs, make, say}) => {
  const OPTIONS = ['設計', '前端', '後端', '測試', '產品', '行銷', '資料分析', '遊戲企劃'];
  const MAX = 3;
  const root = q('.ms'),
    field = q('.ms-field'),
    chips = q('.ms-chips'),
    input = q('.ms-input'),
    list = q('.ms-list'),
    hint = q('.ms-hint'),
    label = q('.ms-label');
  let selected = [],
    matches = [],
    active = -1;
  label.id = uid('ms-label');
  list.id = uid('ms-list');
  hint.id = uid('ms-hint');
  chips.setAttribute('aria-label', '已選項目');
  attrs(input, {
    role: 'combobox',
    'aria-expanded': false,
    'aria-controls': list.id,
    'aria-autocomplete': 'list',
    'aria-labelledby': label.id,
    'aria-describedby': hint.id,
  });
  attrs(list, {role: 'listbox', 'aria-multiselectable': true, 'aria-labelledby': label.id});
  attrs(hint, {'aria-live': 'polite'});

  const full = () => selected.length >= MAX;
  const isOpen = () => !list.hidden;
  function renderChips() {
    chips.replaceChildren();
    selected.forEach(name => {
      const li = make('li', name, 'chip ms-chip');
      const x = make('button', '×', 'ms-x');
      attrs(x, {type: 'button', 'aria-label': '移除 ' + name});
      on(x, 'click', () => {
        toggle(name);
        input.focus();
      });
      li.append(x);
      chips.append(li);
    });
    hint.textContent = full()
      ? '已達上限 ' + MAX + ' 項，移除一項才能再選'
      : '已選 ' + selected.length + ' / ' + MAX + ' 項' + (selected.length ? '' : '，最多 ' + MAX + ' 項');
    hint.classList.toggle('limit', full());
  }
  function renderList() {
    const term = input.value.trim();
    matches = OPTIONS.filter(o => o.includes(term));
    if (active >= matches.length) active = matches.length - 1;
    list.replaceChildren();
    if (!matches.length) {
      const li = make('li', '沒有符合「' + term + '」的選項', 'ms-empty');
      li.setAttribute('role', 'presentation');
      list.append(li);
    }
    matches.forEach((name, i) => {
      const chosen = selected.includes(name);
      const li = make('li');
      attrs(li, {role: 'option', id: uid('ms-opt-') + i, 'aria-selected': chosen, 'aria-disabled': !chosen && full()});
      const check = make('span', '✓', 'ms-check');
      check.setAttribute('aria-hidden', 'true');
      li.append(check);
      const at = term ? name.indexOf(term) : -1;
      if (at >= 0) li.append(name.slice(0, at), make('mark', term), name.slice(at + term.length));
      else li.append(name);
      li.classList.toggle('active', i === active);
      on(li, 'pointerdown', e => {
        e.preventDefault(); // keep focus in the input
        active = i;
        toggle(name);
      });
      list.append(li);
    });
    if (active >= 0 && matches[active]) {
      input.setAttribute('aria-activedescendant', uid('ms-opt-') + active);
      list.querySelector('.active')?.scrollIntoView({block: 'nearest'});
    } else input.removeAttribute('aria-activedescendant');
  }
  function open() {
    if (isOpen()) return;
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    renderList();
  }
  function close() {
    list.hidden = true;
    active = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }
  function toggle(name) {
    if (selected.includes(name)) {
      selected = selected.filter(s => s !== name);
      say('已移除 ' + name + '，已選 ' + selected.length + ' 項');
    } else if (full()) {
      say('已達上限 ' + MAX + ' 項');
      return;
    } else {
      selected = [...selected, name];
      say('已選擇 ' + name + '，已選 ' + selected.length + ' 項');
    }
    renderChips();
    if (isOpen()) renderList();
  }

  on(field, 'pointerdown', e => {
    if (e.target.closest('.ms-x')) return;
    if (e.target === input) return open(); // typing target: just make sure the list is open
    e.preventDefault();
    input.focus();
    isOpen() ? close() : open();
  });
  on(input, 'input', () => {
    active = 0;
    open();
    renderList();
  });
  on(input, 'keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen()) {
        open();
        active = -1;
      }
      if (!matches.length) return;
      active = e.key === 'ArrowDown' ? (active + 1) % matches.length : active <= 0 ? matches.length - 1 : active - 1;
      renderList();
    } else if (e.key === 'Enter') {
      if (isOpen() && matches[active]) {
        e.preventDefault();
        toggle(matches[active]);
      }
    } else if (e.key === 'Escape' && isOpen()) {
      e.preventDefault();
      close();
    } else if (e.key === 'Backspace' && !input.value && selected.length) {
      toggle(selected[selected.length - 1]);
    }
  });
  on(root, 'focusout', e => {
    if (!root.contains(e.relatedTarget)) close();
  });
  on(doc, 'pointerdown', e => {
    if (!root.contains(e.target)) close();
  });

  if (preset === 'selected') selected = ['設計', '前端'];
  if (preset === 'maximum') selected = ['設計', '前端', '遊戲企劃'];
  renderChips();
  if (preset === 'expanded')
    later(() => {
      input.focus();
      open();
    }, 0);
});
