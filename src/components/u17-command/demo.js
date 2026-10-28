// U17 命令面板 — Command Palette，支援鍵盤快捷鍵與模糊搜尋
UILab.define(17, ({root, preset, uid, doc, q, on, later, attrs, make, say, openDialog}) => {
  const open = () => {
    const wrap = make('div'),
      input = make('input'),
      list = make('div', undefined, 'demo-command-list');
    input.placeholder = '搜尋指令…';
    attrs(input, {
      'aria-label': '搜尋指令',
      role: 'combobox',
      'aria-expanded': true,
      'aria-controls': uid('command-list'),
      'aria-autocomplete': 'list',
    });
    list.id = uid('command-list');
    attrs(list, {role: 'listbox', 'aria-label': '指令'});
    wrap.append(input, list);
    let selected = 0,
      visible = [];
    const commands = ['開新專案', '匯出場景', '切換主題', '儲存檔案', '執行測試', '檢視文件'];
    let popup;
    const choose = c => {
      if (c === '切換主題')
        doc.documentElement.dataset.mode = doc.documentElement.dataset.mode === 'dark' ? 'light' : 'dark';
      say('已選擇：' + c + '（示範）');
      popup.dismiss();
    };
    function render() {
      visible = commands.filter(c => c.includes(input.value.trim()));
      list.replaceChildren();
      visible.forEach((c, i) => {
        const el = make('div', c);
        attrs(el, {role: 'option', id: uid('command-') + i, 'aria-selected': i === selected});
        el.classList.toggle('active', i === selected);
        on(el, 'click', () => choose(c));
        list.append(el);
      });
      if (!visible.length) {
        list.append(make('p', '查無符合指令'));
        input.removeAttribute('aria-activedescendant');
      } else input.setAttribute('aria-activedescendant', uid('command-') + selected);
    }
    on(input, 'input', () => {
      selected = 0;
      render();
    });
    on(input, 'keydown', e => {
      if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        selected = Math.max(0, Math.min(visible.length - 1, selected + (e.key === 'ArrowDown' ? 1 : -1)));
        render();
      }
      if (e.key === 'Enter' && visible[selected]) choose(visible[selected]);
    });
    if (preset === 'empty') input.value = '查無此指令';
    render();
    popup = openDialog('命令面板', wrap, input);
  };
  on(q('button'), 'click', open);
  on(doc, 'keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !root.hidden && !doc.querySelector('dialog[open]')) {
      e.preventDefault();
      open();
    }
  });
  if (['expanded', 'empty'].includes(preset)) later(open, 0);
});
