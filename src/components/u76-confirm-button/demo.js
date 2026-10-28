// U76 兩段式確認 — Confirm Button，第一次按下改為確認狀態，限時內再按才執行
UILab.define(76, ({preset, win, q, on, later, text, say, animate}) => {
  const WINDOW = 4000;
  const b = q('.cb-btn'),
    fill = q('.cb-fill');
  let armed = false,
    timer = null,
    run = 0;
  const reset = (message = '已取消刪除') => {
    armed = false;
    run++;
    win.clearTimeout(timer);
    b.classList.remove('armed');
    fill.style.width = '0';
    text('.cb-text', '刪除專案');
    b.removeAttribute('aria-describedby');
    say(message);
  };
  const arm = () => {
    armed = true;
    const own = ++run;
    b.classList.add('armed');
    text('.cb-text', '再按一次確認刪除');
    say('再按一次確認刪除，4 秒後自動取消');
    animate(WINDOW, p => own === run && (fill.style.width = (1 - p) * 100 + '%'));
    timer = later(() => armed && own === run && reset('已逾時，取消刪除'), WINDOW);
  };
  const finish = () => {
    armed = false;
    run++;
    win.clearTimeout(timer);
    b.classList.remove('armed');
    fill.style.width = '0';
    b.disabled = true;
    text('.cb-text', '已刪除 ✓');
    say('專案已刪除');
  };
  on(b, 'click', () => (armed ? finish() : arm()));
  on(b, 'keydown', e => {
    if (e.key === 'Escape' && armed) {
      e.preventDefault();
      reset();
    }
  });
  on(b, 'blur', () => armed && reset('焦點離開，取消刪除'));
  if (preset === 'active') arm();
  if (preset === 'success') finish();
});
