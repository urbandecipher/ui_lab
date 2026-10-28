// U5 摺疊面板 — Accordion，點擊標題展開內容
UILab.define(5, ({preset, uid, all, attrs, button}) => {
  const items = all('.acc-item');
  items.forEach((item, i) => {
    const head = item.querySelector('.acc-head'),
      panel = item.querySelector('.acc-body');
    panel.id = uid('accordion-') + i;
    attrs(head, {'aria-controls': panel.id, 'aria-expanded': false});
    button(head, null, () => {
      const open = !item.classList.contains('open');
      items.forEach(it => {
        it.classList.remove('open');
        it.querySelector('.acc-body').style.maxHeight = '0px';
        it.querySelector('.acc-head').setAttribute('aria-expanded', 'false');
        it.querySelector('.acc-body').hidden = true;
      });
      if (open) {
        item.classList.add('open');
        panel.hidden = false;
        panel.style.maxHeight = panel.scrollHeight + 'px';
        head.setAttribute('aria-expanded', 'true');
      }
    });
    panel.hidden = true;
  });
  if (preset === 'expanded') items[0].querySelector('.acc-head').click();
});
