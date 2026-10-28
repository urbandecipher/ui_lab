// U33 數值滾動計數器 — Rolling Counter，貨幣 / 經驗值增加動畫
UILab.define(33, ({preset, q, on, isReducedMotion, text, say, animate}) => {
  let value = preset === 'success' ? 100 : 0,
    busy = false;
  text('#counterVal', value);
  on(q('button'), 'click', () => {
    if (busy) return;
    const from = value;
    value += 100;
    busy = true;
    animate(
      isReducedMotion() ? 1 : 600,
      p => text('#counterVal', Math.round(from + 100 * (1 - Math.pow(1 - p, 3)))),
      () => {
        busy = false;
        say('目前 ' + value + ' 金幣');
      },
    );
  });
});
