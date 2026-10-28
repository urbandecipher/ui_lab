// U86 手把按鍵圖示 — Input Glyphs，依最後使用的裝置切換按鍵提示
UILab.define(86, ({preset, root, win, q, all, on, text, attrs, make, say, choiceGroup}) => {
  const GLYPHS = {
    keyboard: {confirm: ['Enter', 'key'], back: ['Esc', 'key'], menu: ['Tab', 'key']},
    xbox: {confirm: ['A', 'xa'], back: ['B', 'xb'], menu: ['≡', '']},
    playstation: {confirm: ['✕', 'ps'], back: ['○', 'ps'], menu: ['OPTIONS', 'ps']},
    switch: {confirm: ['A', 'sw'], back: ['B', 'sw'], menu: ['+', 'sw']},
  };
  const NAMES = {keyboard: '鍵盤', xbox: 'Xbox 手把', playstation: 'PlayStation 手把', switch: 'Switch 手把'};
  const SPOKEN = {'✕': '叉叉鍵', '○': '圓圈鍵', '≡': '選單鍵', '+': '加號鍵'};
  const ACTIONS = [
    ['confirm', '確認'],
    ['back', '返回'],
    ['menu', '選單'],
  ];
  const options = all('.ig-devices button'),
    bar = q('.ig-bar');
  let mode = 'auto',
    detected = 'keyboard';
  bar.setAttribute('aria-label', '操作提示');
  const device = () => (mode === 'auto' ? detected : mode);
  function render() {
    const set = GLYPHS[device()];
    bar.replaceChildren();
    ACTIONS.forEach(([key, label]) => {
      const [glyph, cls] = set[key];
      const item = make('span', undefined, 'ig-prompt');
      const g = make('span', glyph, 'ig-glyph ' + cls);
      g.setAttribute('aria-hidden', 'true');
      item.append(g, make('span', label), make('span', '（按 ' + (SPOKEN[glyph] || glyph) + '）', 'sr-only'));
      bar.append(item);
    });
    text('.ig-detect', mode === 'auto' ? '自動偵測：目前使用' + NAMES[detected] : '固定顯示' + NAMES[mode] + '圖示');
  }
  const select = i => {
    mode = options[i].dataset.device;
    options.forEach((b, j) => attrs(b, {'aria-checked': i === j, tabindex: i === j ? 0 : -1}));
    render();
    say(mode === 'auto' ? '自動切換提示圖示' : '顯示' + NAMES[mode] + '圖示');
  };
  choiceGroup(options, select);
  // Any keyboard use inside the component counts as "keyboard" in auto mode.
  on(root, 'keydown', () => {
    if (mode === 'auto' && detected !== 'keyboard') {
      detected = 'keyboard';
      render();
    }
  });
  // Real controllers: pick the glyph set from the Gamepad API id string.
  const fromId = id =>
    /054c|playstation|dualsense|dualshock/i.test(id)
      ? 'playstation'
      : /057e|nintendo|switch|pro controller/i.test(id)
        ? 'switch'
        : 'xbox';
  on(win, 'gamepadconnected', e => {
    detected = fromId(e.gamepad.id);
    if (mode === 'auto') {
      render();
      say('偵測到' + NAMES[detected]);
    }
  });
  const start = preset === 'selected' ? 'playstation' : 'auto';
  const i = options.findIndex(b => b.dataset.device === start);
  mode = start;
  options.forEach((b, j) => attrs(b, {'aria-checked': i === j, tabindex: i === j ? 0 : -1}));
  render();
});
