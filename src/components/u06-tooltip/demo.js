// U6 提示氣泡 — Tooltip，滑鼠懸停顯示說明
UILab.define(6, ({preset, uid, q, on, attrs}) => {
  const target = q('.tooltip-target'),
    tip = q('.tooltip-bubble');
  attrs(target, {tabindex: 0, 'aria-describedby': uid('tooltip')});
  attrs(tip, {id: uid('tooltip'), role: 'tooltip'});
  on(target, 'click', () => target.classList.toggle('tip-open'));
  on(target, 'keydown', e => {
    if (e.key === 'Escape') {
      target.classList.remove('tip-open');
      target.classList.add('tip-dismissed');
    }
    if (['Enter', ' '].includes(e.key)) {
      e.preventDefault();
      target.classList.remove('tip-dismissed');
      target.classList.toggle('tip-open');
    }
  });
  on(target, 'blur', () => target.classList.remove('tip-open', 'tip-dismissed'));
  on(target, 'mouseleave', () => target.classList.remove('tip-dismissed'));
  if (preset === 'expanded') target.classList.add('tip-open');
});
