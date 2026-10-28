// U30 裝備欄拖曳 — Inventory Grid，拖曳交換道具格
UILab.define(30, ({preset, all, on, attrs, button, say}) => {
  const slots = all('.inv-slot');
  let selected = null,
    dragged = null;
  const render = () =>
    slots.forEach((el, i) => {
      el.draggable = !!el.textContent.trim();
      attrs(el, {'aria-label': '道具格 ' + (i + 1) + '：' + (el.textContent || '空'), 'aria-pressed': el === selected});
      el.classList.toggle('selected', el === selected);
    });
  const swap = (a, b) => {
    [a.textContent, b.textContent] = [b.textContent, a.textContent];
    selected = null;
    render();
    say('已交換道具');
  };
  slots.forEach(el => {
    button(el, null, () => {
      if (selected) {
        if (selected !== el) swap(selected, el);
        else {
          selected = null;
          render();
        }
      } else {
        selected = el;
        render();
        say('已選取道具格，再選擇目的地交換');
      }
    });
    on(el, 'dragstart', e => {
      dragged = el;
      e.dataTransfer.setData('text/plain', el.textContent);
    });
    on(el, 'dragover', e => e.preventDefault());
    on(el, 'drop', e => {
      e.preventDefault();
      if (dragged && dragged !== el) swap(dragged, el);
      dragged = null;
    });
    on(el, 'dragend', () => (dragged = null));
  });
  if (preset === 'empty') slots.forEach(el => (el.textContent = ''));
  if (preset === 'selected') selected = slots[0];
  render();
  say('可拖曳，或依序點選兩格交換；鍵盤使用 Enter。');
});
