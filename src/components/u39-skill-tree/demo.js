// U39 技能樹節點 — Skill Tree，消耗點數依序解鎖節點
UILab.define(39, ({preset, q, all, text, attrs, button, say}) => {
  let points = 3;
  const nodes = all('.sk-node');
  const render = () => {
    text('#skPoints', points);
    nodes.forEach((el, i) =>
      attrs(el, {
        'aria-label': '技能 ' + (i + 1) + (el.classList.contains('unlocked') ? '，已解鎖' : '，尚未解鎖'),
        'aria-disabled':
          el.classList.contains('unlocked') || points === 0 || (i > 0 && !nodes[i - 1].classList.contains('unlocked')),
      }),
    );
  };
  nodes.forEach((el, i) =>
    button(el, null, () => {
      if (
        el.classList.contains('unlocked') ||
        points === 0 ||
        (i > 0 && !nodes[i - 1].classList.contains('unlocked'))
      ) {
        say('需要先解鎖前置技能並有可用點數');
        return;
      }
      points--;
      el.classList.add('unlocked');
      q('.sk-line[data-i="' + (i - 1) + '"]')?.classList.add('active');
      render();
      say('技能已解鎖');
    }),
  );
  if (preset === 'success') {
    nodes.forEach(el => el.classList.add('unlocked'));
    all('.sk-line').forEach(el => el.classList.add('active'));
    points = 0;
  }
  render();
});
