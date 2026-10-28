// U40 節奏判定條 — Rhythm Timing，於正確時機點擊判定
UILab.define(40, ({root, preset, doc, win, q, on, frame, motion, isReducedMotion, text, say, control}) => {
  let pos = preset === 'success' ? 50 : 0,
    paused = isReducedMotion() || preset === 'success' || preset === 'error',
    last = win.performance.now(),
    direction = 1;
  const marker = q('#rhythmMarker');
  const render = () => (marker.style.left = pos + '%');
  const tick = now => {
    const delta = Math.min(40, now - last);
    last = now;
    if (!paused && !doc.hidden && root.getClientRects().length) {
      pos += direction * delta * 0.12;
      if (pos >= 100) {
        pos = 100;
        direction = -1;
      }
      if (pos <= 0) {
        pos = 0;
        direction = 1;
      }
      render();
    }
    frame(tick);
  };
  frame(tick);
  on(q('button'), 'click', () => {
    const label = pos >= 40 && pos <= 60 ? 'PERFECT' : pos >= 25 && pos <= 75 ? 'GOOD' : 'MISS';
    text('#rhythmResult', label);
    q('#rhythmResult').className = 'rhythm-result ' + label.toLowerCase();
    say(label);
  });
  const pause = control(
    paused ? '播放' : '暫停',
    () => {
      paused = !paused;
      pause.textContent = paused ? '播放' : '暫停';
    },
    q('.rhythm-actions'),
  );
  on(motion, 'change', () => {
    if (isReducedMotion()) {
      paused = true;
      pause.textContent = '播放';
    }
  });
  on(doc, 'uilab-style-change', () => {
    if (isReducedMotion()) {
      paused = true;
      pause.textContent = '播放';
    }
  });
  if (preset === 'success') text('#rhythmResult', 'PERFECT');
  if (preset === 'error') text('#rhythmResult', 'MISS');
  render();
});
