// U28 生命值條 — HP Bar，傷害瞬間扣除 + 延遲拖尾
UILab.define(28, ({preset, q, on, text, attrs, say}) => {
  let hp = preset === 'empty' ? 0 : preset === 'low' ? 20 : 100;
  const track = q('.hp-track');
  attrs(track, {role: 'meter', 'aria-label': '生命值', 'aria-valuemin': 0, 'aria-valuemax': 100});
  const render = () => {
    text('#hpVal', hp + ' / 100');
    q('#hpFill').style.width = hp + '%';
    q('#hpGhost').style.width = hp + '%';
    track.setAttribute('aria-valuenow', hp);
  };
  on(q('button'), 'click', () => {
    hp = Math.max(0, hp - 20);
    render();
    say(hp ? '剩餘生命值 ' + hp : '生命值歸零');
  });
  render();
});
