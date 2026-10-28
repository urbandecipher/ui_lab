// U12 拖曳排序 — Drag &amp; Drop Reorder
UILab.define(12, ({preset, q, all, on, make, say, control}) => {
  const list = q('#dragList');
  let dragged = null;
  const move = (el, dir) => {
    if (dir < 0 && el.previousElementSibling) el.previousElementSibling.before(el);
    if (dir > 0 && el.nextElementSibling) el.nextElementSibling.after(el);
    say('已更新排序');
  };
  all('.drag-item').forEach(el => {
    const label = el.textContent.trim();
    const controls = make('span', undefined, 'reorder-controls');
    control('↑', () => move(el, -1), controls).setAttribute('aria-label', label + ' 上移');
    control('↓', () => move(el, 1), controls).setAttribute('aria-label', label + ' 下移');
    el.append(controls);
    on(el, 'dragstart', e => {
      dragged = el;
      e.dataTransfer.setData('text/plain', label);
      el.classList.add('dragging');
    });
    on(el, 'dragend', () => {
      dragged = null;
      all('.drag-item').forEach(it => it.classList.remove('dragging', 'drag-over'));
    });
    on(el, 'dragover', e => {
      e.preventDefault();
      el.classList.add('drag-over');
    });
    on(el, 'dragleave', () => el.classList.remove('drag-over'));
    on(el, 'drop', e => {
      e.preventDefault();
      el.classList.remove('drag-over');
      if (dragged && dragged !== el) {
        const items = [...list.children];
        if (items.indexOf(dragged) < items.indexOf(el)) el.after(dragged);
        else el.before(dragged);
        say('已更新排序');
      }
    });
  });
  if (preset === 'reordered') list.append(list.firstElementChild);
  say('可拖曳，或使用上下按鈕排序。');
});
