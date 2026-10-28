// U56 空狀態 — Empty State，首次使用／無結果／失敗
UILab.define(56, ({preset, q, make, say, control}) => {
  const area = q('.empty-wrap');
  let items = preset === 'filled' ? ['收藏項目 1', '收藏項目 2'] : [],
    kind = preset === 'error' ? 'error' : 'first';
  const copy = {
    first: ['☆', '還沒有收藏', '把喜歡的內容加入收藏，之後就能在這裡找到。', '新增第一筆'],
    error: ['!', '無法載入收藏', '連線中斷，資料沒有遺失，請稍後再試。', '重新載入'],
  };
  const render = () => {
    area.replaceChildren();
    if (items.length) {
      const ul = make('ul', undefined, 'empty-list');
      ul.setAttribute('aria-label', '收藏清單');
      items.forEach(t => ul.append(make('li', t)));
      area.append(ul);
      control(
        '清空收藏',
        () => {
          items = [];
          kind = 'first';
          render();
          area.querySelector('button')?.focus();
          say('收藏已清空');
        },
        area,
      );
      return;
    }
    const [icon, title, desc, cta] = copy[kind],
      box = make('div', undefined, 'empty-state'),
      ic = make('div', icon, 'empty-icon');
    box.dataset.kind = kind;
    ic.setAttribute('aria-hidden', 'true');
    box.append(ic, make('strong', title), make('p', desc));
    const action = control(
      cta,
      () => {
        if (kind === 'error') {
          kind = 'first';
          say('已重新載入');
        } else {
          items = ['收藏項目 1', '收藏項目 2'];
          say('已新增 2 筆收藏');
        }
        render();
        area.querySelector('button')?.focus();
      },
      box,
    );
    action.className = 'btn btn-primary';
    area.append(box);
  };
  render();
});
