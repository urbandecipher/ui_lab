// U77 連線狀態 — Connection Banner，離線時說明影響、恢復後回報同步結果
UILab.define(77, ({preset, win, q, on, later, text, attrs, say}) => {
  const banner = q('.cn-banner'),
    toggle = q('.cn-toggle');
  let offline = false,
    pending = 0,
    hideTimer = null;
  attrs(banner, {role: 'status'});
  const render = () => {
    toggle.textContent = offline ? '恢復連線' : '切換為離線';
    text('.cn-line', '待辦清單' + (pending ? '（' + pending + ' 項變更待同步）' : ''));
  };
  function goOffline() {
    if (offline) return;
    offline = true;
    win.clearTimeout(hideTimer);
    banner.hidden = false;
    banner.classList.remove('online');
    text('.cn-text', '目前離線。變更會先存在這台裝置，連線後自動同步。');
    render();
  }
  function goOnline() {
    if (!offline) return;
    offline = false;
    banner.hidden = false;
    banner.classList.add('online');
    text('.cn-text', pending ? '已恢復連線，正在同步 ' + pending + ' 項變更…' : '已恢復連線。');
    render();
    hideTimer = later(() => {
      if (pending) say('已同步 ' + pending + ' 項變更');
      text('.cn-text', pending ? '已同步 ' + pending + ' 項變更。' : '已恢復連線。');
      pending = 0;
      render();
      hideTimer = later(() => !offline && (banner.hidden = true), 2500);
    }, 1200);
  }
  on(toggle, 'click', () => (offline ? goOnline() : goOffline()));
  on(q('.cn-edit'), 'click', () => {
    if (offline) {
      pending++;
      render();
      say('已暫存，連線後同步');
    } else say('已儲存');
  });
  // Real network changes drive the same banner.
  on(win, 'offline', goOffline);
  on(win, 'online', goOnline);
  if (preset === 'offline') {
    pending = 2;
    goOffline();
  }
  if (preset === 'success') {
    pending = 2;
    offline = true;
    goOnline();
  }
  render();
});
