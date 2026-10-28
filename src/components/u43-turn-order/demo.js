// U43 回合順序軌 — Turn Order Tracker，回合制行動順序佇列
UILab.define(43, ({preset, q, on, make, say}) => {
  let queue = ['🧙', '🗡', '🏹', '🐉'];
  const render = () => {
    q('#turnRow').replaceChildren();
    queue.forEach((icon, i) => {
      const el = make('div', icon, 'turn-icon' + (!i ? ' active' : ''));
      if (!i) el.setAttribute('aria-current', 'step');
      q('#turnRow').append(el);
    });
  };
  on(q('button'), 'click', () => {
    queue.push(queue.shift());
    render();
    say('已進入下一回合');
  });
  if (preset === 'selected') queue.push(queue.shift());
  render();
});
