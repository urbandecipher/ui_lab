// U37 連擊計數器 — Combo Counter，連續攻擊累積連段 + 衰減條
UILab.define(37, ({preset, q, on, animate}) => {
  let count = 0,
    version = 0;
  on(q('button'), 'click', () => {
    const own = ++version;
    count++;
    q('#comboNum').firstChild.textContent = count;
    animate(
      1600,
      p => {
        if (own !== version) return;
        q('#comboDecayFill').style.width = (1 - p) * 100 + '%';
      },
      () => {
        if (own === version) {
          count = 0;
          q('#comboNum').firstChild.textContent = 0;
        }
      },
    );
  });
  if (preset === 'active') {
    count = 5;
    q('#comboNum').firstChild.textContent = 5;
  }
});
