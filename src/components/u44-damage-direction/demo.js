// U44 方向傷害指示 — Directional Damage Indicator，標示受擊方位
UILab.define(44, ({preset, q, on, later, make, say}) => {
  const hit = () => {
    const arc = make('div', undefined, 'dmgdir-arc');
    arc.style.transform = 'rotate(45deg) translateX(44px)';
    q('#dmgdirRing').append(arc);
    arc.style.opacity = 1;
    say('右上方受到傷害');
    later(() => arc.remove(), 700);
  };
  on(q('button'), 'click', hit);
  if (preset === 'active') hit();
});
