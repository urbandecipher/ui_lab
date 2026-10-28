// U89 成就通知 — Achievement Toast，排隊依序顯示，懸停或聚焦時暫停倒數
UILab.define(89, ({preset, win, doc, q, on, make, frame, isReducedMotion}) => {
  const LIST = [
    ['🗡', '初次勝利', '贏得第一場戰鬥', '78.4%'],
    ['🧭', '探險家', '發現 10 個地點', '24.1%'],
    ['🐉', '屠龍者', '在困難模式擊敗巨龍', '3.2%'],
  ];
  const SHOW = 4000,
    MAX_VISIBLE = 2;
  const stack = q('.ac-stack'),
    trigger = q('.ac-trigger');
  let next = 0;
  const queue = [];
  stack.setAttribute('role', 'status');
  const queueNote = make('p', '', 'ac-queue');
  q('.ac').append(queueNote);
  const visible = () => stack.querySelectorAll('.ac-toast').length;
  function renderQueue() {
    queueNote.textContent = queue.length ? '還有 ' + queue.length + ' 個成就等待顯示' : '';
  }
  function show(item) {
    const [icon, title, desc, rarity] = item;
    const toast = make('div', undefined, 'ac-toast');
    const ic = make('span', icon, 'ac-icon');
    ic.setAttribute('aria-hidden', 'true');
    const body = make('div');
    body.append(
      make('span', '成就解鎖', 'ac-kicker'),
      make('strong', title, 'ac-title'),
      make('span', desc + ' · ' + rarity + ' 玩家擁有', 'ac-desc'),
    );
    const close = make('button', '×', 'ac-close');
    close.type = 'button';
    close.setAttribute('aria-label', '關閉成就通知：' + title);
    const bar = make('span', undefined, 'ac-timer');
    bar.setAttribute('aria-hidden', 'true');
    toast.append(ic, body, close, bar);
    stack.append(toast);
    // Countdown pauses while hovered or focused; reduced motion just hides the bar.
    let left = SHOW,
      last = win.performance.now(),
      paused = false,
      gone = false;
    const done = () => {
      if (gone) return;
      gone = true;
      toast.remove();
      if (queue.length) show(queue.shift());
      renderQueue();
    };
    const tick = now => {
      if (gone) return;
      if (!paused) left -= now - last;
      last = now;
      bar.style.width = isReducedMotion() ? '0' : Math.max(0, (left / SHOW) * 100) + '%';
      if (left <= 0) done();
      else frame(tick);
    };
    frame(tick);
    on(toast, 'pointerenter', () => (paused = true));
    on(toast, 'pointerleave', () => (paused = toast.contains(doc.activeElement)));
    on(toast, 'focusin', () => (paused = true));
    on(toast, 'focusout', e => !toast.contains(e.relatedTarget) && (paused = false));
    on(close, 'click', () => {
      done();
      trigger.focus();
    });
  }
  function unlock() {
    const item = LIST[next % LIST.length];
    next++;
    if (visible() >= MAX_VISIBLE) queue.push(item);
    else show(item);
    renderQueue();
  }
  on(trigger, 'click', unlock);
  if (preset === 'active') unlock();
});
