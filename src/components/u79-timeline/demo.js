// U79 時間軸 — Timeline，事件依時間排列，標示完成／目前／未來
UILab.define(79, ({preset, q, on, later, make, say}) => {
  const EVENTS = [
    ['訂單成立', '10/20 09:12', 'done'],
    ['付款完成', '10/20 09:13', 'done'],
    ['賣家出貨', '10/21 15:40', 'done'],
    ['抵達轉運中心', '10/22 08:05', 'done'],
    ['配送中', '10/23 10:30', 'current'],
    ['送達', '預計 10/23 18:00 前', 'upcoming'],
  ];
  const LABEL = {done: '已完成', current: '進行中', upcoming: '尚未開始'};
  const list = q('.tl-list'),
    more = q('.tl-more');
  const HIDDEN = 3;
  let expanded = false;
  list.setAttribute('aria-label', '配送進度');
  function render(focusFirstNew) {
    list.replaceChildren();
    const shown = expanded ? EVENTS : EVENTS.slice(HIDDEN);
    // Newest first: the current step sits at the top.
    [...shown].reverse().forEach(([title, time, status], i) => {
      const li = make('li', undefined, 'tl-item');
      li.dataset.status = status;
      if (status === 'current') li.setAttribute('aria-current', 'step');
      const dot = make('span', status === 'done' ? '✓' : '', 'tl-dot');
      dot.setAttribute('aria-hidden', 'true');
      const body = make('div');
      const strong = make('strong', title);
      if (status === 'current') strong.append(make('span', '進行中', 'tl-status'));
      const sr = make('span', '（' + LABEL[status] + '）', 'sr-only');
      strong.append(sr);
      body.append(strong, make('span', time, 'tl-meta'));
      li.append(dot, body);
      if (focusFirstNew && i === shown.length - HIDDEN) {
        li.tabIndex = -1;
        later(() => li.focus(), 0);
      }
      list.append(li);
    });
    more.textContent = expanded ? '只顯示最近紀錄' : '顯示較早的 ' + HIDDEN + ' 筆';
    more.setAttribute('aria-expanded', expanded);
  }
  on(more, 'click', () => {
    expanded = !expanded;
    render(expanded);
    say(expanded ? '已顯示全部 ' + EVENTS.length + ' 筆' : '只顯示最近 ' + (EVENTS.length - HIDDEN) + ' 筆');
  });
  expanded = preset === 'expanded';
  render(false);
});
