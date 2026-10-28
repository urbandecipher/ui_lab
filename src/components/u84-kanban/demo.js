// U84 跨欄看板 — Kanban，拖曳、鍵盤或按鈕在欄位間移動卡片
UILab.define(84, ({preset, q, on, make, say}) => {
  const board = q('.kb-board');
  const COLS = ['待辦', '進行中', '完成'];
  let data = [['撰寫需求文件', '設計審查'], ['首頁切版'], ['建立專案']];
  let grabbed = null, // {col, idx, snapshot}
    dragFrom = null;
  const find = title => {
    for (let c = 0; c < data.length; c++) {
      const i = data[c].indexOf(title);
      if (i >= 0) return [c, i];
    }
    return [-1, -1];
  };
  function move(title, toCol, toIdx) {
    const [c, i] = find(title);
    data[c].splice(i, 1);
    data[toCol].splice(Math.max(0, Math.min(toIdx, data[toCol].length)), 0, title);
  }
  function render(focusTitle) {
    board.replaceChildren();
    COLS.forEach((name, c) => {
      const col = make('section', undefined, 'kb-col');
      col.setAttribute('aria-label', name + '，' + data[c].length + ' 張');
      const h = make('h4');
      h.append(make('span', name), make('span', String(data[c].length)));
      h.setAttribute('aria-hidden', 'true');
      const list = make('ul', undefined, 'kb-list');
      data[c].forEach((title, i) => {
        const li = make('li', undefined, 'kb-card');
        li.tabIndex = 0;
        li.draggable = true;
        li.dataset.title = title;
        li.setAttribute(
          'aria-label',
          title + '，' + name + '，第 ' + (i + 1) + ' 張' + (grabbed?.title === title ? '，已拿起' : ''),
        );
        li.classList.toggle('grabbed', grabbed?.title === title);
        li.append(make('span', title));
        const moves = make('div', undefined, 'kb-moves');
        [-1, 1].forEach(d => {
          const b = make('button', d < 0 ? '◀' : '▶');
          b.type = 'button';
          b.disabled = !COLS[c + d];
          if (COLS[c + d]) b.setAttribute('aria-label', '移到「' + COLS[c + d] + '」');
          on(b, 'click', () => {
            move(title, c + d, data[c + d].length);
            render(title);
            say(title + ' 移到「' + COLS[c + d] + '」');
          });
          moves.append(b);
        });
        li.append(moves);
        on(li, 'keydown', e => keys(e, title));
        on(li, 'dragstart', e => {
          dragFrom = title;
          e.dataTransfer.setData('text/plain', title);
          li.classList.add('dragging');
        });
        on(li, 'dragend', () => {
          dragFrom = null;
          render();
        });
        list.append(li);
      });
      on(col, 'dragover', e => {
        if (!dragFrom) return;
        e.preventDefault();
        col.classList.add('drop');
      });
      on(col, 'dragleave', e => !col.contains(e.relatedTarget) && col.classList.remove('drop'));
      on(col, 'drop', e => {
        e.preventDefault();
        if (!dragFrom) return;
        const cards = [...list.querySelectorAll('.kb-card')].filter(el => el.dataset.title !== dragFrom);
        const idx = cards.findIndex(el => e.clientY < el.getBoundingClientRect().top + el.offsetHeight / 2);
        const title = dragFrom;
        move(title, c, idx < 0 ? cards.length : idx);
        dragFrom = null;
        render(title);
        say(title + ' 移到「' + name + '」');
      });
      col.append(h, list);
      board.append(col);
    });
    if (focusTitle) board.querySelector('[data-title="' + focusTitle + '"]')?.focus();
  }
  function keys(e, title) {
    if (e.target !== e.currentTarget) return; // ignore keys on the move buttons
    const [c, i] = find(title);
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (grabbed) {
        grabbed = null;
        render(title);
        say('已放下 ' + title + '，在「' + COLS[c] + '」第 ' + (i + 1) + ' 張');
      } else {
        grabbed = {title, snapshot: data.map(col => [...col])};
        render(title);
        say('已拿起 ' + title + '。方向鍵移動，空白鍵放下，Esc 取消');
      }
      return;
    }
    if (!grabbed) return;
    const delta = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[e.key];
    if (delta) {
      e.preventDefault();
      const toCol = c + delta[0];
      if (!COLS[toCol]) return;
      const toIdx = delta[0] ? Math.min(i, data[toCol].length) : i + delta[1];
      if (!delta[0] && (toIdx < 0 || toIdx >= data[c].length)) return;
      move(title, toCol, toIdx);
      render(title);
      const [nc, ni] = find(title);
      say('「' + COLS[nc] + '」第 ' + (ni + 1) + ' 張');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      data = grabbed.snapshot;
      grabbed = null;
      render(title);
      say('已取消移動');
    }
  }
  if (preset === 'reordered') data = [['設計審查'], ['首頁切版', '撰寫需求文件'], ['建立專案']];
  render();
});
