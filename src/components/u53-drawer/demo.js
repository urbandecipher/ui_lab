// U53 側邊抽屜 — Drawer / Sheet，不離開頁面的補充面板
UILab.define(53, ({number, preset, uid, doc, q, portals, on, later, attrs, make, say, control}) => {
  const launch = q('button');
  attrs(launch, {'aria-haspopup': 'dialog', 'aria-expanded': false});
  const open = () => {
    const previous = doc.activeElement,
      d = make('dialog', undefined, 'drawer'),
      head = make('div', undefined, 'drawer-head'),
      h = make('h3', '篩選條件'),
      x = make('button', '✕', 'catalog-button');
    h.id = uid('drawer-title-') + number;
    d.setAttribute('aria-labelledby', h.id);
    x.type = 'button';
    x.setAttribute('aria-label', '關閉篩選');
    head.append(h, x);
    const content = make('div', undefined, 'drawer-body');
    ['只顯示有庫存', '免運費', '新品上架', '可貨到付款'].forEach(label => {
      const row = make('label', undefined, 'check-row'),
        box = make('input');
      box.type = 'checkbox';
      row.append(box, ' ' + label);
      content.append(row);
    });
    const foot = make('div', undefined, 'drawer-foot');
    d.append(head, content, foot);
    control('清除', () => d.querySelectorAll('input').forEach(i => (i.checked = false)), foot);
    const apply = control(
      '套用',
      () => {
        say('已套用 ' + d.querySelectorAll('input:checked').length + ' 個條件');
        d.close();
      },
      foot,
    );
    apply.className = 'btn btn-primary';
    on(x, 'click', () => d.close());
    on(d, 'click', e => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
    on(d, 'close', () => {
      d.remove();
      portals.delete(d);
      launch.setAttribute('aria-expanded', 'false');
      if (previous?.isConnected) previous.focus({preventScroll: true});
    });
    doc.body.append(d);
    portals.add(d);
    d.showModal();
    launch.setAttribute('aria-expanded', 'true');
    d.querySelector('input').focus();
  };
  on(launch, 'click', open);
  if (preset === 'expanded') later(open, 0);
});
