// U75 跳至主內容 — Skip Link，鍵盤使用者略過重複的頁首導覽
UILab.define(75, ({preset, q, all, on, later, say}) => {
  const link = q('.sk-link'),
    main = q('.sk-main'),
    page = q('.sk-page');
  on(link, 'click', e => {
    e.preventDefault();
    main.focus();
    say('已跳到主內容');
  });
  // Demo-only links go nowhere.
  all('.sk-header nav a, .sk-main a').forEach(a => on(a, 'click', e => e.preventDefault()));
  on(page, 'pointerdown', e => {
    if (e.target === page || !e.target.closest('a')) {
      e.preventDefault();
      page.focus();
    }
  });
  if (preset === 'active') later(() => link.focus(), 0);
});
