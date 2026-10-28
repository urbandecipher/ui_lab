// U47 自動完成搜尋 — Combobox，輸入時即時篩選建議
UILab.define(47, ({preset, uid, q, on, later, attrs, make, say}) => {
  const input = q('.combo-input'),
    list = q('.combo-list'),
    data = [
      '台北',
      '台中',
      '台南',
      '高雄',
      '新竹',
      '桃園',
      '基隆',
      '花蓮',
      '台東',
      '東京',
      '大阪',
      '首爾',
      '新加坡',
      '曼谷',
    ];
  let active = -1,
    matches = [];
  list.id = uid('combo-list');
  attrs(input, {
    role: 'combobox',
    'aria-expanded': false,
    'aria-controls': list.id,
    'aria-autocomplete': 'list',
    'aria-label': '搜尋城市',
  });
  attrs(list, {role: 'listbox', 'aria-label': '建議城市'});
  const close = () => {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  };
  const choose = c => {
    input.value = c;
    close();
    say('已選擇 ' + c);
  };
  const render = () => {
    const v = input.value.trim();
    matches = v ? data.filter(c => c.includes(v)) : [];
    list.replaceChildren();
    if (!v) {
      close();
      return;
    }
    if (!matches.length) {
      const li = make('li', '沒有符合「' + v + '」的城市', 'combo-empty');
      li.setAttribute('role', 'presentation');
      list.append(li);
    }
    matches.forEach((c, i) => {
      const li = make('li');
      attrs(li, {role: 'option', id: uid('combo-') + i, 'aria-selected': i === active});
      const at = c.indexOf(v);
      li.append(c.slice(0, at), make('mark', v), c.slice(at + v.length));
      li.classList.toggle('active', i === active);
      on(li, 'pointerdown', e => {
        e.preventDefault();
        choose(c);
      });
      list.append(li);
    });
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    if (active >= 0) {
      input.setAttribute('aria-activedescendant', uid('combo-') + active);
      list.querySelector('.active')?.scrollIntoView({block: 'nearest'});
    } else input.removeAttribute('aria-activedescendant');
  };
  on(input, 'input', () => {
    active = -1;
    render();
    if (input.value.trim()) say(matches.length ? matches.length + ' 個建議' : '沒有建議');
  });
  on(input, 'keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (list.hidden && input.value.trim()) {
        render();
      }
      if (!matches.length) return;
      e.preventDefault();
      active = e.key === 'ArrowDown' ? (active + 1) % matches.length : active <= 0 ? matches.length - 1 : active - 1;
      render();
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      choose(matches[active]);
    } else if (e.key === 'Escape' && !list.hidden) {
      e.preventDefault();
      close();
    }
  });
  on(input, 'blur', close);
  if (preset === 'expanded') {
    input.value = '台';
    later(render, 0);
  }
  if (preset === 'empty') {
    input.value = '火星';
    later(render, 0);
  }
});
