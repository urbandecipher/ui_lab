// U24 雙滑桿範圍 — Dual Range，設定最小 / 最大值
UILab.define(24, ({preset, q, on, text, attrs}) => {
  const low = q('#dualLow'),
    high = q('#dualHigh');
  attrs(low, {'aria-label': '價格下限'});
  attrs(high, {'aria-label': '價格上限'});
  const render = changed => {
    if (+low.value > +high.value - 5) {
      if (changed === high) high.value = Math.min(100, +low.value + 5);
      else low.value = Math.max(0, +high.value - 5);
    }
    text('#dualMin', low.value);
    text('#dualMax', high.value);
    q('#dualFill').style.left = low.value + '%';
    q('#dualFill').style.width = high.value - low.value + '%';
  };
  on(low, 'input', () => render(low));
  on(high, 'input', () => render(high));
  if (preset === 'maximum') {
    low.value = 0;
    high.value = 100;
  }
  render();
});
