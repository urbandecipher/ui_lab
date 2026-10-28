// U87 存檔欄位 — Save Slots，選欄位後載入／儲存／刪除，覆寫與刪除需再按一次確認
UILab.define(87, ({preset, uid, win, q, on, later, text, attrs, make, say}) => {
  const list = q('.sv-list'),
    load = q('.sv-load'),
    save = q('.sv-save'),
    del = q('.sv-delete');
  let slots = [
    {chapter: '第三章・霧之森', play: '12:34:05', time: '2026-10-27 22:10', hue: 150},
    {chapter: '第二章・港都', play: '07:02:41', time: '2026-10-20 21:48', hue: 210},
    null,
  ];
  let selected = 0,
    armed = null,
    armTimer = null;
  attrs(list, {role: 'listbox', tabindex: 0, 'aria-label': '存檔欄位'});
  const describe = (s, i) => '欄位 ' + (i + 1) + '：' + (s ? s.chapter + '，遊玩 ' + s.play + '，' + s.time : '空白');
  function disarm() {
    armed = null;
    win.clearTimeout(armTimer);
    save.textContent = '儲存到此欄';
    del.textContent = '刪除';
    save.classList.remove('armed');
    del.classList.remove('armed');
  }
  function render() {
    list.replaceChildren();
    slots.forEach((s, i) => {
      const li = make('li', undefined, 'sv-slot' + (s ? '' : ' empty'));
      attrs(li, {role: 'option', id: uid('sv-') + i, 'aria-selected': i === selected});
      const thumb = make('span', undefined, 'sv-thumb');
      thumb.setAttribute('aria-hidden', 'true');
      if (s) thumb.style.setProperty('--h', s.hue);
      const body = make('div');
      body.append(
        make('strong', '欄位 ' + (i + 1) + (s ? '・' + s.chapter : '・空白')),
        make('span', s ? '遊玩 ' + s.play + ' · ' + s.time : '尚未儲存', 'sv-meta'),
      );
      li.append(thumb, body);
      on(li, 'click', () => choose(i));
      list.append(li);
    });
    list.setAttribute('aria-activedescendant', uid('sv-') + selected);
    load.disabled = !slots[selected];
    del.disabled = !slots[selected];
  }
  function choose(i) {
    selected = i;
    disarm();
    render();
    say(describe(slots[i], i));
  }
  // Destructive actions need a second press within 4 seconds.
  function confirmOr(button, kind, run, prompt) {
    if (armed === kind) {
      disarm();
      return run();
    }
    disarm();
    armed = kind;
    button.textContent = prompt;
    button.classList.add('armed');
    say(prompt);
    armTimer = later(disarm, 4000);
  }
  on(list, 'keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      choose((selected + (e.key === 'ArrowDown' ? 1 : slots.length - 1)) % slots.length);
    } else if (e.key === 'Enter' && slots[selected]) {
      e.preventDefault();
      load.click();
    } else if (e.key === 'Delete' && slots[selected]) {
      e.preventDefault();
      del.click();
    }
  });
  on(load, 'click', () => {
    disarm();
    text('.sv-msg', '已載入欄位 ' + (selected + 1) + '（示範）');
    say('已載入欄位 ' + (selected + 1));
  });
  on(save, 'click', () => {
    const write = () => {
      const d = new win.Date();
      const p = n => String(n).padStart(2, '0');
      slots[selected] = {
        chapter: '第四章・雪原',
        play: '13:05:12',
        time:
          d.getFullYear() +
          '-' +
          p(d.getMonth() + 1) +
          '-' +
          p(d.getDate()) +
          ' ' +
          p(d.getHours()) +
          ':' +
          p(d.getMinutes()),
        hue: 190,
      };
      render();
      text('.sv-msg', '已儲存到欄位 ' + (selected + 1));
      say('已儲存到欄位 ' + (selected + 1));
    };
    if (!slots[selected]) return write();
    confirmOr(save, 'save', write, '再按一次覆寫欄位 ' + (selected + 1));
  });
  on(del, 'click', () =>
    confirmOr(
      del,
      'delete',
      () => {
        slots[selected] = null;
        render();
        text('.sv-msg', '已刪除欄位 ' + (selected + 1));
        say('已刪除欄位 ' + (selected + 1));
        list.focus();
      },
      '再按一次刪除',
    ),
  );
  if (preset === 'selected') selected = 1;
  if (preset === 'empty') slots = [null, null, null];
  render();
});
