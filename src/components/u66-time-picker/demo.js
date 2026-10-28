// U66 時間選擇器 — Time Picker，時／分欄位以方向鍵或數字輸入
UILab.define(66, ({preset, uid, win, all, q, on, attrs, say}) => {
  const STEP = 15,
    OPEN = 9 * 60,
    LAST = 17 * 60 + 45;
  const wrap = q('.time-wrap'),
    label = q('.time-label'),
    field = q('.time-field'),
    msg = q('.time-msg'),
    hidden = q('.time-value'),
    [hourEl, minuteEl] = all('.time-seg');
  const value = {h: null, m: null};
  let typed = '';
  const pad = n => String(n).padStart(2, '0');
  const fmt = minutes => pad(Math.floor(minutes / 60)) + ':' + pad(minutes % 60);
  label.id = uid('time-label');
  msg.id = uid('time-msg');
  attrs(field, {role: 'group', 'aria-labelledby': label.id, 'aria-describedby': msg.id});
  attrs(msg, {role: 'status'});
  const segs = [
    {el: hourEl, key: 'h', name: '時', min: 0, max: 23, step: 1},
    {el: minuteEl, key: 'm', name: '分', min: 0, max: 45, step: STEP},
  ];

  function render() {
    for (const s of segs) {
      const v = value[s.key];
      s.el.textContent = v === null ? '--' : pad(v);
      s.el.toggleAttribute('data-empty', v === null);
      attrs(s.el, {
        role: 'spinbutton',
        tabindex: 0,
        'aria-label': s.name,
        'aria-valuemin': s.min,
        'aria-valuemax': s.max,
        'aria-valuetext': v === null ? '未設定' : v + ' ' + s.name,
      });
      if (v === null) s.el.removeAttribute('aria-valuenow');
      else s.el.setAttribute('aria-valuenow', v);
    }
    const complete = value.h !== null && value.m !== null;
    const total = complete ? value.h * 60 + value.m : null;
    const ok = complete && total >= OPEN && total <= LAST;
    hidden.value = complete ? fmt(total) : '';
    wrap.classList.toggle('error', complete && !ok);
    wrap.classList.toggle('success', ok);
    msg.className = 'field-msg time-msg' + (complete ? (ok ? ' success' : ' error') : '');
    msg.textContent = !complete
      ? '可預約 ' + fmt(OPEN) + '–' + fmt(LAST) + '，每 ' + STEP + ' 分鐘一個時段'
      : ok
        ? '已選擇 ' + fmt(total)
        : fmt(total) + ' 不在可預約時段（' + fmt(OPEN) + '–' + fmt(LAST) + '）';
  }
  // Minutes always land on a 15-minute slot.
  const snap = m => Math.min(45, Math.round(m / STEP) * STEP);

  segs.forEach((s, i) => {
    on(s.el, 'focus', () => (typed = ''));
    on(s.el, 'keydown', e => {
      const v = value[s.key];
      const span = s.max - s.min + s.step;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const dir = e.key === 'ArrowUp' ? 1 : -1;
        value[s.key] = v === null ? (s.key === 'h' ? 9 : 0) : ((v - s.min + dir * s.step + span) % span) + s.min;
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        value[s.key] = e.key === 'Home' ? s.min : s.max;
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        value[s.key] = null;
        typed = '';
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        segs[e.key === 'ArrowRight' ? 1 : 0].el.focus();
        return;
      } else if (/^\d$/.test(e.key)) {
        e.preventDefault();
        typed = (typed + e.key).slice(-2);
        let n = Number(typed);
        if (s.key === 'h') {
          if (n > 23) {
            typed = e.key;
            n = Number(e.key);
          }
          value.h = n;
          // A second digit, or a first digit that cannot start a valid hour, completes the field.
          if (typed.length === 2 || n > 2) {
            typed = '';
            minuteEl.focus();
          }
        } else {
          if (n > 59) {
            typed = e.key;
            n = Number(e.key);
          }
          const snapped = snap(n);
          value.m = snapped;
          if (typed.length === 2) {
            typed = '';
            if (snapped !== n) say('已調整為 ' + pad(snapped) + ' 分');
          }
        }
      } else return;
      render();
    });
  });
  on(field, 'pointerdown', e => {
    if (!e.target.classList.contains('time-seg')) {
      e.preventDefault();
      (value.h === null ? hourEl : minuteEl).focus();
    }
  });
  on(q('.time-now'), 'click', () => {
    const now = new win.Date();
    const next = Math.ceil((now.getHours() * 60 + now.getMinutes()) / STEP) * STEP;
    const pick = next < OPEN || next > LAST ? OPEN : next;
    value.h = Math.floor(pick / 60) % 24;
    value.m = pick % 60;
    render();
    say('已選擇 ' + fmt(pick));
  });

  if (preset === 'selected') Object.assign(value, {h: 14, m: 30});
  if (preset === 'error') Object.assign(value, {h: 19, m: 0});
  render();
});
