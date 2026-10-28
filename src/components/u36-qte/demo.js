// U36 快速反應事件 — QTE，限時圈縮小，時機內點擊成功
UILab.define(36, ({preset, win, q, on, later, isReducedMotion, text, say}) => {
  const start = q('#qteStart'),
    target = q('#qteTarget'),
    hit = q('#qteBtn');
  let active = false,
    timer;
  hit.setAttribute('aria-label', '命中 QTE');
  const finish = success => {
    if (!active) return;
    active = false;
    win.clearTimeout(timer);
    target.style.display = 'none';
    start.style.display = 'inline-block';
    text('#qteResult', success ? 'HIT! 完美時機' : 'MISS 錯過時機');
    q('#qteResult').className = 'qte-result ' + (success ? 'hit' : 'miss');
    start.focus();
    say(success ? '命中成功' : '錯過時機');
  };
  on(start, 'click', () => {
    start.style.display = 'none';
    target.style.display = 'block';
    text('#qteResult', '');
    const ring = q('.qte-ring');
    ring.classList.remove('countdown');
    void ring.getBoundingClientRect();
    ring.classList.add('countdown');
    active = true;
    hit.focus();
    timer = later(() => finish(false), isReducedMotion() ? 5000 : 1400);
  });
  on(hit, 'click', () => finish(true));
  if (['success', 'error'].includes(preset)) {
    text('#qteResult', preset === 'success' ? 'HIT! 完美時機' : 'MISS 錯過時機');
    q('#qteResult').classList.add(preset === 'success' ? 'hit' : 'miss');
  }
});
