// U10 星級評分 — Star Rating，點擊評分
UILab.define(10, ({preset, all, attrs, choiceGroup}) => {
  const items = all('#rating span');
  const select = n =>
    items.forEach((el, i) => {
      el.classList.toggle('filled', i <= n);
      attrs(el, {'aria-checked': i === n, tabindex: i === n ? 0 : -1});
    });
  items.forEach((el, i) => el.setAttribute('aria-label', i + 1 + ' 星'));
  choiceGroup(items, select);
  select(preset === 'selected' ? 4 : 2);
});
