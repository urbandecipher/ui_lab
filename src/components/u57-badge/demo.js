// U57 通知徽章 — Badge，未讀數量與狀態標籤
UILab.define(57, ({preset, q, on, say}) => {
  const bell = q('.badge-bell'),
    count = q('.badge-count');
  let n = preset === 'maximum' ? 128 : preset === 'empty' ? 0 : 3;
  const render = () => {
    count.textContent = n > 99 ? '99+' : n;
    count.hidden = n === 0;
    bell.setAttribute('aria-label', '通知' + (n ? '，' + n + ' 則未讀' : '，沒有未讀'));
  };
  on(q('.badge-add'), 'click', () => {
    n++;
    render();
    say(n + ' 則未讀');
  });
  on(bell, 'click', () => {
    if (!n) return;
    n = 0;
    render();
    say('已全部標為已讀');
  });
  render();
});
