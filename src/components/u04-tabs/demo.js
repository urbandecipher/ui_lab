// U4 分頁籤 — Tabs，切換顯示不同內容區塊
UILab.define(4, ({preset, uid, all, attrs, choiceGroup}) => {
  const items = all('#tabBar button');
  const panels = all('.tab-panel');
  function select(i) {
    items.forEach((el, j) => {
      el.classList.toggle('active', i === j);
      attrs(el, {'aria-selected': i === j, tabindex: i === j ? 0 : -1});
    });
    panels.forEach((el, j) => {
      el.classList.toggle('active', j === i);
      el.hidden = j !== i;
    });
  }
  choiceGroup(items, select, 'tab');
  panels.forEach((el, i) => {
    el.id = uid('tab-panel-') + i;
    items[i].id = uid('tab-') + i;
    attrs(items[i], {'aria-controls': el.id});
    attrs(el, {role: 'tabpanel', 'aria-labelledby': items[i].id, tabindex: 0});
  });
  select(preset === 'selected' ? 1 : 0);
});
