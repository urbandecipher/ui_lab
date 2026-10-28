// U20 標籤輸入 — Chip / Tag Input，Enter 新增、點 × 移除
UILab.define(20, ({preset, q, all, on, attrs, make, say}) => {
  const input = q('#chipInput');
  input.setAttribute('aria-label', '新增標籤');
  const bind = chip => {
    const old = chip.querySelector('.x');
    const label = chip.textContent.replace('×', '');
    const remove = make('button', '×', 'x');
    attrs(remove, {'aria-label': '移除標籤 ' + label, type: 'button'});
    old.replaceWith(remove);
    on(remove, 'click', () => {
      chip.remove();
      input.focus();
      say('已移除 ' + label);
    });
  };
  all('.chip').forEach(bind);
  on(input, 'keydown', e => {
    if (e.key !== 'Enter' || e.isComposing) return;
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    const chip = make('span', value, 'chip');
    chip.append(make('span', '×', 'x'));
    input.before(chip);
    bind(chip);
    input.value = '';
    say('已加入標籤');
  });
  if (preset === 'empty') all('.chip').forEach(el => el.remove());
});
