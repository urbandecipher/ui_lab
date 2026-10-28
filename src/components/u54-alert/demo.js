// U54 提示橫幅 — Alert Banner，四種語意等級、可關閉
UILab.define(54, ({preset, q, on, make, say, control}) => {
  const stack = q('.alert-stack'),
    wrap = q('.alert-wrap'),
    kinds = [
      ['info', 'i', '資訊', '系統將於今晚 23:00 維護 30 分鐘。'],
      ['success', '✓', '成功', '設定已儲存並同步到所有裝置。'],
      ['warn', '!', '注意', '儲存空間剩餘 10%。'],
      ['error', '✕', '錯誤', '付款失敗，請確認卡片資訊後重試。'],
    ];
  let visible = preset === 'empty' ? [] : kinds.map(k => k[0]);
  const render = () => {
    stack.replaceChildren();
    kinds
      .filter(k => visible.includes(k[0]))
      .forEach(([kind, icon, label, message]) => {
        const el = make('div', undefined, 'alert alert-' + kind),
          ic = make('span', icon, 'alert-icon'),
          p = make('p'),
          x = make('button', '✕', 'alert-x');
        ic.setAttribute('aria-hidden', 'true');
        p.append(make('strong', label), message);
        x.type = 'button';
        x.setAttribute('aria-label', '關閉「' + label + '」提示');
        on(x, 'click', () => {
          const i = visible.indexOf(kind);
          visible.splice(i, 1);
          render();
          say('已關閉' + label + '提示');
          (stack.querySelectorAll('.alert-x')[Math.min(i, visible.length - 1)] || restore).focus();
        });
        el.append(ic, p, x);
        stack.append(el);
      });
    restore.hidden = visible.length === kinds.length;
  };
  const restore = control(
    '重新顯示全部',
    () => {
      visible = kinds.map(k => k[0]);
      render();
      stack.querySelector('.alert-x')?.focus();
    },
    wrap,
  );
  render();
});
