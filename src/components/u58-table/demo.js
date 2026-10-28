// U58 資料表格 — Sortable Table，欄位排序與列選取
UILab.define(58, ({preset, q, all, on, text, make, say}) => {
  const rows = [
    {name: '無線滑鼠', qty: 12, date: '2026-09-02'},
    {name: '機械鍵盤', qty: 5, date: '2026-08-15'},
    {name: '螢幕支架', qty: 8, date: '2026-10-01'},
    {name: 'USB-C 集線器', qty: 20, date: '2026-07-21'},
  ];
  let key = null,
    dir = 1,
    picked = new Set();
  const tbody = q('tbody'),
    selectAll = q('thead input');
  const sync = () => {
    selectAll.checked = picked.size === rows.length;
    selectAll.indeterminate = picked.size > 0 && picked.size < rows.length;
    tbody.querySelectorAll('tr').forEach(tr => tr.classList.toggle('picked', tr.querySelector('input').checked));
    text(
      '.table-meta',
      picked.size
        ? '已選取 ' + picked.size + ' / ' + rows.length + ' 筆'
        : '共 ' + rows.length + ' 筆 · 點擊欄位標題排序',
    );
  };
  const render = () => {
    all('th[data-key]').forEach(th => {
      const k = th.dataset.key;
      th.setAttribute('aria-sort', k === key ? (dir > 0 ? 'ascending' : 'descending') : 'none');
      th.querySelector('.th-icon').textContent = k === key ? (dir > 0 ? '↑' : '↓') : '↕';
    });
    const sorted = [...rows].sort((a, b) =>
      key ? (typeof a[key] === 'number' ? a[key] - b[key] : a[key].localeCompare(b[key], 'zh-Hant')) * dir : 0,
    );
    tbody.replaceChildren();
    sorted.forEach(r => {
      const tr = make('tr'),
        td = make('td'),
        box = make('input');
      box.type = 'checkbox';
      box.checked = picked.has(r.name);
      box.setAttribute('aria-label', '選取 ' + r.name);
      on(box, 'change', () => {
        box.checked ? picked.add(r.name) : picked.delete(r.name);
        sync();
      });
      td.append(box);
      tr.append(td, make('td', r.name), make('td', String(r.qty), 'num'), make('td', r.date, 'num'));
      tbody.append(tr);
    });
    sync();
  };
  all('th[data-key]').forEach(th => {
    const label = th.textContent,
      b = make('button', label, 'th-sort'),
      icon = make('span', '↕', 'th-icon');
    b.type = 'button';
    icon.setAttribute('aria-hidden', 'true');
    b.append(icon);
    th.replaceChildren(b);
    on(b, 'click', () => {
      if (key === th.dataset.key) dir = -dir;
      else {
        key = th.dataset.key;
        dir = 1;
      }
      render();
      say('依「' + label + '」' + (dir > 0 ? '遞增' : '遞減') + '排序');
    });
  });
  on(selectAll, 'change', () => {
    picked = selectAll.checked ? new Set(rows.map(r => r.name)) : new Set();
    render();
  });
  if (preset === 'selected') picked = new Set([rows[0].name, rows[2].name]);
  if (preset === 'reordered') {
    key = 'qty';
    dir = -1;
  }
  render();
});
