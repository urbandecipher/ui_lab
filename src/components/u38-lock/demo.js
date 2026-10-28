// U38 鎖定目標 — Lock-On Reticle，點擊鎖定並持續旋轉標記
UILab.define(38, ({preset, q, text, button}) => {
  const el = q('#lockTarget');
  let locked = preset === 'selected';
  const render = () => {
    el.classList.toggle('locked', locked);
    el.setAttribute('aria-pressed', locked);
    text('#lockLabel', locked ? '目標已鎖定' : '點擊鎖定目標');
  };
  button(el, '鎖定目標', () => {
    locked = !locked;
    render();
  });
  render();
});
