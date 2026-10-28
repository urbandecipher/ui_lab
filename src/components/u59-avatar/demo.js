// U59 頭像群組 — Avatar Group，上線狀態與 +N 收合
UILab.define(59, ({preset, q, on, text, attrs, make}) => {
  const names = ['陳怡君', '王志明', '李佳穎', '張家豪', '林雅婷', '黃俊傑', '吳淑芬'],
    hues = [12, 205, 145, 275, 38, 330, 95],
    group = q('.avatar-group'),
    visibleMax = 4;
  let expanded = preset === 'expanded';
  const render = () => {
    group.replaceChildren();
    (expanded ? names : names.slice(0, visibleMax)).forEach((name, i) => {
      const a = make('span', name[0], 'avatar');
      a.style.setProperty('--h', hues[i]);
      a.style.zIndex = String(names.length - i);
      attrs(a, {role: 'img', 'aria-label': name + (i < 2 ? '（線上）' : ''), title: name});
      a.classList.toggle('online', i < 2);
      group.append(a);
    });
    if (names.length > visibleMax) {
      const more = make('button', expanded ? '−' : '+' + (names.length - visibleMax), 'avatar avatar-more');
      more.type = 'button';
      attrs(more, {
        'aria-expanded': expanded,
        'aria-label': expanded ? '收合成員' : '顯示其餘 ' + (names.length - visibleMax) + ' 位成員',
      });
      on(more, 'click', () => {
        expanded = !expanded;
        render();
        group.querySelector('.avatar-more').focus();
      });
      group.append(more);
    }
    text('.avatar-meta', names.length + ' 位成員 · 2 位線上');
  };
  render();
});
