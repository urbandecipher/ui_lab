// U83 分割面板 — Split Pane，拖曳或方向鍵調整兩欄寬度，可收合
UILab.define(83, ({preset, uid, q, on, attrs, say}) => {
  const MIN = 20,
    MAX = 75,
    STEP = 5;
  const root = q('.sp'),
    handle = q('.sp-handle'),
    a = q('.sp-a');
  let value = 40,
    beforeCollapse = 40;
  a.id = uid('sp-a');
  attrs(handle, {
    role: 'separator',
    tabindex: 0,
    'aria-orientation': 'vertical',
    'aria-controls': a.id,
    'aria-label': '調整檔案清單寬度',
    'aria-valuemin': 0,
    'aria-valuemax': MAX,
  });
  function set(v, announce) {
    value = Math.round(v === 0 ? 0 : Math.min(MAX, Math.max(MIN, v)));
    root.style.setProperty('--split', value + '%');
    a.hidden = value === 0;
    handle.setAttribute('aria-valuenow', value);
    handle.setAttribute('aria-valuetext', value === 0 ? '左側已收合' : '左側 ' + value + '%');
    if (announce) say(value === 0 ? '左側已收合' : '左側 ' + value + '%');
  }
  on(handle, 'keydown', e => {
    const map = {ArrowLeft: value - STEP, ArrowRight: value + STEP, Home: MIN, End: MAX};
    if (e.key in map) {
      e.preventDefault();
      set(value === 0 && e.key === 'ArrowRight' ? MIN : map[e.key], true);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (value === 0) set(beforeCollapse, true);
      else {
        beforeCollapse = value;
        set(0, true);
      }
    }
  });
  let dragging = false;
  on(handle, 'pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragging = true;
    root.classList.add('dragging');
    handle.setPointerCapture(e.pointerId);
    handle.focus();
  });
  on(handle, 'pointermove', e => {
    if (!dragging) return;
    const r = root.getBoundingClientRect();
    set(((e.clientX - r.left) / r.width) * 100);
  });
  const stop = () => {
    if (!dragging) return;
    dragging = false;
    root.classList.remove('dragging');
    say('左側 ' + value + '%');
  };
  on(handle, 'pointerup', stop);
  on(handle, 'lostpointercapture', stop);
  on(handle, 'dblclick', () => set(40, true));
  set(preset === 'collapsed' ? 0 : preset === 'maximum' ? MAX : 40);
});
