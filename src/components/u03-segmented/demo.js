// U3 分段控制 — Segmented Control，單選模式切換
UILab.define(3, ({preset, all, attrs, choiceGroup}) => {
  const items = all('#segmented button');
  function select(i) {
    items.forEach((el, j) => {
      el.classList.toggle('active', i === j);
      attrs(el, {'aria-checked': i === j, tabindex: i === j ? 0 : -1});
    });
  }
  choiceGroup(items, select, 'radio');
  select(preset === 'selected' ? 1 : 0);
});
