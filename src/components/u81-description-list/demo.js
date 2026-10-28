// U81 描述清單 — Description List，欄位與值成對呈現，支援複製與遮罩顯示
UILab.define(81, ({preset, win, all, on, say}) => {
  all('[data-copy]').forEach(b => {
    const value = b.previousElementSibling.textContent;
    b.setAttribute('aria-label', '複製' + b.closest('.dl-row').querySelector('dt').textContent + ' ' + value);
    on(b, 'click', async () => {
      try {
        await win.navigator.clipboard.writeText(value);
        b.textContent = '已複製';
        say('已複製 ' + value);
      } catch {
        say('瀏覽器未允許自動複製，請手動選取');
      }
    });
  });
  all('[data-reveal]').forEach(b => {
    const val = b.previousElementSibling,
      masked = val.textContent,
      label = b.closest('.dl-row').querySelector('dt').textContent;
    let open = false;
    const render = () => {
      val.textContent = open ? val.dataset.full : masked;
      b.textContent = open ? '隱藏' : '顯示';
      b.setAttribute('aria-pressed', open);
      b.setAttribute('aria-label', (open ? '隱藏完整' : '顯示完整') + label);
    };
    on(b, 'click', () => {
      open = !open;
      render();
      say(open ? label + ' ' + val.dataset.full : '已隱藏' + label);
    });
    open = preset === 'expanded';
    render();
  });
});
