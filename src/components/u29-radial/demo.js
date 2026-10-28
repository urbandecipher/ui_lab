// U29 轉輪選擇器 — Radial Wheel，點擊開啟環形選單
UILab.define(29, ({preset, q, all, on, button, say}) => {
  const menu = q('#radialMenu'),
    launch = q('.module-body > div > button'),
    items = all('.radial-item');
  const close = () => {
    menu.classList.remove('open');
    menu.inert = true;
    launch.setAttribute('aria-expanded', 'false');
    launch.focus();
  };
  on(launch, 'click', () => {
    menu.classList.add('open');
    menu.inert = false;
    launch.setAttribute('aria-expanded', 'true');
    items[0].focus();
  });
  items.forEach((el, i) =>
    button(el, ['選擇劍', '選擇盾', '選擇藥水', '選擇弓', '選擇法杖'][i], () => {
      say(el.getAttribute('aria-label'));
      close();
    }),
  );
  button(q('.radial-center'), '關閉轉輪', close);
  on(menu, 'keydown', e => {
    if (e.key === 'Escape') close();
  });
  menu.inert = true;
  launch.setAttribute('aria-expanded', 'false');
  if (preset === 'expanded') launch.click();
});
