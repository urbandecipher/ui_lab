// U85 按鍵重新綁定 — Key Rebinding，按下新按鍵即綁定，衝突時自動對調並說明
UILab.define(85, ({preset, q, on, later, text, make, say}) => {
  const DEFAULTS = [
    ['跳躍', 'Space'],
    ['攻擊', 'KeyJ'],
    ['互動', 'KeyE'],
    ['背包', 'KeyI'],
    ['衝刺', 'ShiftLeft'],
  ];
  const NAMES = {
    Space: '空白鍵',
    ShiftLeft: '左 Shift',
    ShiftRight: '右 Shift',
    ControlLeft: '左 Ctrl',
    ControlRight: '右 Ctrl',
    AltLeft: '左 Alt',
    AltRight: '右 Alt',
    Enter: 'Enter',
    Backspace: 'Backspace',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    CapsLock: 'Caps Lock',
  };
  // Bindings use KeyboardEvent.code so they follow key position, not keyboard layout.
  const label = code =>
    NAMES[code] ||
    code
      .replace(/^Key/, '')
      .replace(/^Digit/, '')
      .replace(/^Numpad/, '數字鍵 ');
  let binds = new Map(DEFAULTS),
    listening = null,
    rendering = false;
  const list = q('.kr-list');
  list.setAttribute('aria-label', '按鍵設定');
  function render(focusAction) {
    // Removing a focused button fires blur in some browsers; that must not cancel listening.
    rendering = true;
    list.replaceChildren();
    for (const [action, code] of binds) {
      const li = make('li', undefined, 'kr-row');
      const name = make('span', action);
      const b = make('button', listening === action ? '按下新按鍵…' : label(code), 'kr-key');
      b.type = 'button';
      b.dataset.action = action;
      b.classList.toggle('listening', listening === action);
      b.classList.toggle('changed', code !== DEFAULTS.find(d => d[0] === action)[1]);
      b.setAttribute(
        'aria-label',
        action + '：' + (listening === action ? '請按下新按鍵，Esc 取消' : label(code) + '，按 Enter 變更'),
      );
      on(b, 'click', () => {
        if (listening) return;
        listening = action;
        render(action);
        say('請按下「' + action + '」的新按鍵，Esc 取消');
      });
      on(b, 'keydown', e => capture(e, action));
      on(b, 'blur', () => {
        if (!rendering && b.isConnected && listening === action) {
          listening = null;
          render();
        }
      });
      li.append(name, b);
      list.append(li);
    }
    rendering = false;
    if (focusAction) list.querySelector('[data-action="' + focusAction + '"]').focus();
  }
  function capture(e, action) {
    if (listening !== action) return;
    if (e.key === 'Tab') return; // let focus leave; blur cancels
    e.preventDefault();
    if (e.repeat) return;
    if (e.code === 'Escape') {
      listening = null;
      render(action);
      return say('已取消');
    }
    const old = binds.get(action);
    const other = [...binds].find(([a, c]) => a !== action && c === e.code)?.[0];
    binds.set(action, e.code);
    if (other) binds.set(other, old);
    listening = null;
    const notice = other
      ? '「' + action + '」改為 ' + label(e.code) + '；原本使用此鍵的「' + other + '」改為 ' + label(old) + '。'
      : '「' + action + '」改為 ' + label(e.code) + '。';
    text('.kr-notice', notice);
    render(action);
    say(notice);
  }
  on(q('.kr-reset'), 'click', () => {
    binds = new Map(DEFAULTS);
    listening = null;
    render();
    text('.kr-notice', '已恢復預設按鍵。');
    say('已恢復預設按鍵');
  });
  if (preset === 'success') {
    binds.set('互動', 'KeyF');
    text('.kr-notice', '「互動」改為 F。');
  }
  render();
  if (preset === 'active') later(() => list.querySelector('.kr-key').click(), 0);
});
