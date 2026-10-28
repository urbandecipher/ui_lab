// U11 複製到剪貼簿 — Copy to Clipboard
UILab.define(11, ({preset, win, q, on, text, make, say, openDialog}) => {
  on(q('#copyBtn'), 'click', async () => {
    try {
      await win.navigator.clipboard.writeText(q('.copy-field').textContent);
      text('#copyBtn', '已複製');
      say('已複製到剪貼簿');
    } catch {
      say('未能自動複製，請手動複製。');
      const input = make('textarea');
      input.value = q('.copy-field').textContent;
      input.readOnly = true;
      input.setAttribute('aria-label', '待複製文字');
      openDialog('手動複製', input, input);
      input.select();
    }
  });
  if (preset === 'success') text('#copyBtn', '已複製');
  if (preset === 'error') say('未能自動複製，請手動複製。');
});
