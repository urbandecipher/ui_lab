// U41 行動點數量表 — Action Point Pips，消耗後隨時間自動回復
UILab.define(41, ({preset, win, q, on, later, make, say}) => {
  let points = preset === 'empty' ? 0 : 5,
    timer;
  const b = q('button');
  const render = () => {
    q('#apRow').replaceChildren();
    for (let i = 0; i < 5; i++) q('#apRow').append(make('span', undefined, 'ap-pip' + (i < points ? ' full' : '')));
    q('#apRow').setAttribute('aria-label', '行動點 ' + points + ' / 5');
    b.disabled = points === 0;
  };
  const regen = () => {
    if (points < 5) {
      points++;
      render();
      if (points < 5) timer = later(regen, 2000);
    }
  };
  on(b, 'click', () => {
    if (!points) return;
    points--;
    render();
    say('剩餘 ' + points + ' 點');
    win.clearTimeout(timer);
    timer = later(regen, 2000);
  });
  render();
});
