// U32 虛擬搖桿 — Virtual Joystick，拖曳輸出方向座標
UILab.define(32, ({preset, q, on, text, attrs}) => {
  const base = q('#joyBase'),
    nub = q('#joyNub');
  let active = false;
  attrs(nub, {tabindex: 0, role: 'group', 'aria-label': '虛擬搖桿，使用方向鍵移動'});
  const set = (x, y) => {
    const max = base.getBoundingClientRect().width / 2 - 19,
      d = Math.max(1, Math.hypot(x, y));
    x /= d;
    y /= d;
    nub.style.transform = 'translate(calc(-50% + ' + x * max + 'px),calc(-50% + ' + y * max + 'px))';
    text('#joyReadout', 'X: ' + x.toFixed(2) + '  Y: ' + y.toFixed(2));
  };
  const reset = () => {
    active = false;
    set(0, 0);
  };
  on(nub, 'pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault();
    active = true;
    nub.focus();
    nub.setPointerCapture(e.pointerId);
  });
  on(nub, 'pointermove', e => {
    if (!active) return;
    const r = base.getBoundingClientRect(),
      max = r.width / 2 - 19;
    set((e.clientX - r.left - r.width / 2) / max, (e.clientY - r.top - r.height / 2) / max);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture', 'blur'].forEach(event => on(nub, event, reset));
  on(nub, 'keydown', e => {
    const dirs = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]};
    if (dirs[e.key]) {
      e.preventDefault();
      set(...dirs[e.key]);
    }
  });
  on(nub, 'keyup', reset);
  if (preset === 'active') set(0.7, -0.7);
});
