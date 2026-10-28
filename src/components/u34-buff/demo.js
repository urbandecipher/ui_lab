// U34 狀態效果列 — Buff/Debuff Tray，環形倒數 + 懸停說明
UILab.define(34, ({preset, q, all, on, attrs, make}) => {
  all('.buff-icon').forEach(el => {
    attrs(el, {tabindex: 0, 'aria-label': el.querySelector('.buff-tip').textContent});
    on(el, 'click', () => el.classList.toggle('tip-open'));
  });
  if (preset === 'empty') q('.buff-row').replaceChildren(make('span', '目前沒有狀態效果'));
});
