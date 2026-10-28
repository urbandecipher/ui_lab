// U23 複選框群組 — Checkbox，含全選 / 不確定狀態
UILab.define(23, ({preset, q, all, on}) => {
  const parent = q('#ckParent'),
    children = all('.ckChild');
  const sync = () => {
    const count = children.filter(el => el.checked).length;
    parent.checked = count === children.length;
    parent.indeterminate = count > 0 && count < children.length;
  };
  on(parent, 'change', () => children.forEach(el => (el.checked = parent.checked)));
  children.forEach(el => on(el, 'change', sync));
  if (preset === 'partial') children[0].checked = true;
  if (preset === 'selected') children.forEach(el => (el.checked = true));
  sync();
});
