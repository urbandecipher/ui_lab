// U22 長按確認 — Press &amp; Hold，避免誤觸的破壞性操作
UILab.define(22, ({preset, doc, win, q, on, frame, text, say}) => {
  const b = q('#holdBtn'),
    fill = q('#holdFill');
  let holding = false,
    done = false,
    start = 0;
  const cancel = () => {
    holding = false;
    if (!done) fill.style.width = '0%';
  };
  const finish = () => {
    done = true;
    holding = false;
    b.classList.add('done');
    text('#holdText', '已刪除 ✓');
    say('示範刪除完成');
  };
  const tick = now => {
    if (!holding) return;
    const p = Math.min(1, (now - start) / 2000);
    fill.style.width = p * 100 + '%';
    if (p === 1) finish();
    else frame(tick);
  };
  const begin = () => {
    if (done || holding) return;
    holding = true;
    start = win.performance.now();
    frame(tick);
  };
  on(b, 'pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault();
    b.focus();
    b.setPointerCapture(e.pointerId);
    begin();
  });
  ['pointerup', 'pointercancel', 'lostpointercapture', 'blur'].forEach(event => on(b, event, cancel));
  on(b, 'pointermove', e => {
    const r = b.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) cancel();
  });
  on(b, 'keydown', e => {
    if (['Enter', ' '].includes(e.key)) {
      e.preventDefault();
      if (!e.repeat) begin();
    }
  });
  on(b, 'keyup', cancel);
  on(doc, 'visibilitychange', () => {
    if (doc.hidden) cancel();
  });
  if (preset === 'success') {
    fill.style.width = '100%';
    finish();
  }
});
