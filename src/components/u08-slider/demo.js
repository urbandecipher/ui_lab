// U8 滑桿控制 — Range Slider，即時數值回饋
UILab.define(8, ({preset, q, on, text}) => {
  const el = q('input');
  el.setAttribute('aria-label', '音量增益');
  on(el, 'input', () => text('#sliderVal', el.value + '%'));
  if (preset === 'maximum') el.value = 100;
  text('#sliderVal', el.value + '%');
});
