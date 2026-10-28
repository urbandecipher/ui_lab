// U9 進度條 — Progress Bar，點擊按鈕模擬載入
UILab.define(9, ({preset, q, on, text, attrs, say, animate}) => {
  let busy = false;
  const track = q('.progress-track'),
    b = q('button');
  attrs(track, {role: 'progressbar', 'aria-label': '處理進度', 'aria-valuemin': 0, 'aria-valuemax': 100});
  const set = (n, label) => {
    q('#progFill').style.width = n + '%';
    track.setAttribute('aria-valuenow', Math.round(n));
    text('#progText', label);
  };
  set(
    preset === 'success' ? 100 : preset === 'loading' ? 50 : 0,
    preset === 'success' ? '完成' : preset === 'loading' ? '載入中…' : preset === 'error' ? '失敗，請重試' : '待機中',
  );
  on(b, 'click', () => {
    if (busy) return;
    busy = true;
    b.disabled = true;
    animate(
      1800,
      p => set(p * 100, '載入中…'),
      () => {
        busy = false;
        b.disabled = false;
        set(100, '完成');
        say('處理完成');
      },
    );
  });
});
