// U16 卡片翻轉 — Flip Card，點擊查看背面
UILab.define(16, ({preset, q, button}) => {
  const el = q('.flip-scene');
  const render = () => {
    const flipped = el.classList.contains('flipped');
    el.setAttribute('aria-pressed', flipped);
    q('.flip-front').setAttribute('aria-hidden', flipped);
    q('.flip-back').setAttribute('aria-hidden', !flipped);
  };
  button(el, '翻轉卡片', () => {
    el.classList.toggle('flipped');
    render();
  });
  if (preset === 'flipped') el.classList.add('flipped');
  render();
});
