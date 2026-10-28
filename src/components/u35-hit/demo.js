// U35 命中回饋 — Hit Feedback，震動 + 傷害數字彈出
UILab.define(35, ({preset, q, on, later, make, say}) => {
  const hit = () => {
    const el = q('#hitTarget');
    el.classList.remove('flash', 'shake');
    void el.offsetWidth;
    el.classList.add('flash', 'shake');
    const damage = make('div', '-20', 'dmg-popup');
    el.append(damage);
    later(() => damage.remove(), 800);
    say('造成 20 點傷害');
  };
  on(q('button'), 'click', hit);
  if (preset === 'active') hit();
});
