// U2 開關切換 — Toggle Switch，點擊改變啟用狀態
UILab.define(2, ({preset, q, text, attrs, button}) => {
  const el = q('#toggle1');
  let enabled = preset === 'on';
  const render = () => {
    el.classList.toggle('on', enabled);
    attrs(el, {role: 'switch', 'aria-checked': enabled});
    text('#toggleLabel', enabled ? 'ON' : 'OFF');
    q('#toggleLabel').classList.toggle('on', enabled);
  };
  button(el, '啟用設定', () => {
    enabled = !enabled;
    render();
  });
  render();
});
