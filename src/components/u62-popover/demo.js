// U62 彈出層 — Popover，點擊開啟、含互動內容
UILab.define(62, ({preset, uid, doc, q, on, later, attrs, say}) => {
  const wrap = q('.pop-wrap'),
    trigger = q('.pop-trigger'),
    panel = q('.pop-panel');
  panel.id = uid('popover');
  attrs(panel, {role: 'dialog', 'aria-label': '分享設定'});
  attrs(trigger, {'aria-haspopup': 'dialog', 'aria-expanded': false, 'aria-controls': panel.id});
  const open = () => {
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    panel.querySelector('input').focus();
  };
  const close = (focus = true) => {
    if (panel.hidden) return;
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (focus) trigger.focus();
  };
  on(trigger, 'click', () => (panel.hidden ? open() : close()));
  on(q('.pop-close'), 'click', () => {
    const allow = panel.querySelector('input').checked;
    close();
    say(allow ? '已允許留言' : '僅可檢視');
  });
  on(panel, 'keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  });
  on(doc, 'pointerdown', e => {
    if (!wrap.contains(e.target)) close(false);
  });
  on(wrap, 'focusout', e => {
    if (e.relatedTarget && !wrap.contains(e.relatedTarget)) close(false);
  });
  if (preset === 'expanded') later(open, 0);
});
