// 設計變數總表：點變數名稱複製 var()，下載 tokens.css／tokens.json。
(() => {
  const section = document.getElementById('design-tokens');
  if (!section) return;
  const manifest = JSON.parse(document.getElementById('uilab-manifest').textContent);
  const status = section.querySelector('.token-status');
  const download = (name, text, type) => {
    const url = URL.createObjectURL(new Blob([text], {type: type + ';charset=utf-8'}));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = '已建立 ' + name + ' 下載';
  };
  section.addEventListener('click', async event => {
    const copy = event.target.closest('[data-copy]');
    if (copy) {
      try {
        await navigator.clipboard.writeText(copy.dataset.copy);
        status.textContent = '已複製 ' + copy.dataset.copy;
      } catch {
        status.textContent = '瀏覽器未允許自動複製：' + copy.dataset.copy;
      }
      return;
    }
    const kind = event.target.closest('[data-token-download]')?.dataset.tokenDownload;
    if (kind === 'css')
      download('tokens.css', document.getElementById('uilab-tokens').textContent.trim() + '\n', 'text/css');
    if (kind === 'json') {
      // base = 預設（淺色）；variants 為覆寫：mode:dark、density:compact、corners:square／round
      const {base, ...variants} = manifest.tokens;
      download(
        'tokens.json',
        JSON.stringify({version: manifest.version, base, variants}, null, 2) + '\n',
        'application/json',
      );
    }
  });
})();
