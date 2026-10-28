// U15 通知提示 — Toast，短暫浮現的操作回饋
UILab.define(15, ({preset, doc, q, portals, on, later, attrs, make}) => {
  const stack = make('div', undefined, 'toast-stack');
  attrs(stack, {role: 'status', 'aria-live': 'polite'});
  doc.body.append(stack);
  portals.add(stack);
  const show = () => {
    const toast = make('div', preset === 'error' ? '操作失敗，請重試' : '操作已成功執行', 'toast');
    stack.append(toast);
    later(() => toast.remove(), 3000);
  };
  on(q('button'), 'click', show);
  if (['success', 'error'].includes(preset)) show();
});
