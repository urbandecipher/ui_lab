// U46 數字步進器 — Number Stepper，加減按鈕與鍵盤調整
UILab.define(46, ({preset, q, all, on, attrs, say}) => {
  const input = q('.num-input'),
    [dec, inc] = all('.num-btn'),
    min = 1,
    max = 10;
  let v = preset === 'maximum' ? max : min;
  const render = () => {
    input.value = v;
    attrs(input, {role: 'spinbutton', 'aria-valuenow': v, 'aria-valuemin': min, 'aria-valuemax': max});
    dec.disabled = v <= min;
    inc.disabled = v >= max;
  };
  const set = n => {
    const before = v;
    v = Math.max(min, Math.min(max, Number.isFinite(n) ? Math.round(n) : v));
    render();
    if (v !== before) say('數量 ' + v);
  };
  on(dec, 'click', () => {
    set(v - 1);
    if (dec.disabled) input.focus();
  });
  on(inc, 'click', () => {
    set(v + 1);
    if (inc.disabled) input.focus();
  });
  on(input, 'keydown', e => {
    const map = {ArrowUp: v + 1, ArrowDown: v - 1, PageUp: v + 5, PageDown: v - 5, Home: min, End: max};
    if (e.key in map) {
      e.preventDefault();
      set(map[e.key]);
    }
  });
  on(input, 'change', () => set(parseInt(input.value.replace(/\D/g, ''), 10)));
  render();
});
