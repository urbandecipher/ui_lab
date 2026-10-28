// U78 自動儲存 — Autosave，停止輸入後儲存，失敗時自動重試並可立即重試
UILab.define(78, ({preset, uid, win, q, on, later, text, attrs, say}) => {
  const IDLE = 800,
    SAVE = 600,
    RETRY = 5000;
  const root = q('.as'),
    input = q('.as-input'),
    retry = q('.as-retry'),
    fail = q('.as-fail');
  let idleTimer = null,
    saveTimer = null,
    retryTimer = null,
    lastSaved = '';
  input.id = uid('as-input');
  q('.as-label').htmlFor = input.id;
  const status = q('.as-status');
  status.id = uid('as-status');
  attrs(input, {'aria-describedby': status.id});
  const clock = () => {
    const d = new win.Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  };
  const show = (state, message) => {
    root.dataset.state = state;
    text('.as-text', message);
    retry.hidden = state !== 'error';
  };
  const clearAll = () => [idleTimer, saveTimer, retryTimer].forEach(t => win.clearTimeout(t));
  function save() {
    clearAll();
    show('saving', '儲存中…');
    saveTimer = later(() => {
      if (fail.checked) {
        show('error', '儲存失敗，' + RETRY / 1000 + ' 秒後重試');
        say('儲存失敗，將自動重試');
        retryTimer = later(save, RETRY);
        return;
      }
      lastSaved = input.value;
      show('saved', '已儲存 · ' + clock());
    }, SAVE);
  }
  on(input, 'input', () => {
    clearAll();
    show('editing', '編輯中…');
    idleTimer = later(() => (input.value === lastSaved ? show('saved', '沒有變更') : save()), IDLE);
  });
  on(retry, 'click', () => {
    save();
    input.focus();
  });
  lastSaved = input.value;
  if (preset === 'saving') show('saving', '儲存中…');
  else if (preset === 'error') {
    fail.checked = true;
    show('error', '儲存失敗，' + RETRY / 1000 + ' 秒後重試');
  } else show('saved', '所有變更都已儲存');
});
