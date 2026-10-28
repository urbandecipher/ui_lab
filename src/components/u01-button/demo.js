// U1 按鈕狀態 — Primary / Secondary / Disabled / Loading
UILab.define(1, ({preset, q, on, later, say}) => {
  const b = q('#loadBtn');
  let busy = false;
  const set = s => {
    b.disabled = s === 'loading';
    b.setAttribute('aria-busy', s === 'loading');
    b.textContent = {default: '開始處理', loading: '處理中…', success: '完成 ✓', error: '失敗，點擊重試'}[s];
  };
  set(['loading', 'success', 'error'].includes(preset) ? preset : 'default');
  on(b, 'click', () => {
    if (busy) return;
    busy = true;
    set('loading');
    later(() => {
      busy = false;
      set('success');
      say('處理完成');
    }, 1000);
  });
});
