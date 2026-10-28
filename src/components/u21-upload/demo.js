// U21 檔案拖放上傳 — File Drop Zone，拖曳或點擊選擇檔案
UILab.define(21, ({preset, q, on, text, button, say}) => {
  const zone = q('#dropzone'),
    input = q('#fileInput');
  button(zone, '選擇檔案', () => input.click());
  const choose = file => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      text('#fname', '檔案超過 10 MB，請重新選擇');
      say('檔案過大');
      return;
    }
    text('#fname', '已選擇：' + file.name);
    say('檔案已選擇，尚未上傳。');
  };
  on(input, 'change', () => choose(input.files[0]));
  ['dragenter', 'dragover'].forEach(event =>
    on(zone, event, e => {
      e.preventDefault();
      zone.classList.add('dragover');
    }),
  );
  ['dragleave', 'drop'].forEach(event =>
    on(zone, event, e => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (event === 'drop') choose(e.dataTransfer.files[0]);
    }),
  );
  say('選擇或拖入檔案，最大 10 MB；此範例不傳送檔案。');
  if (preset === 'success') text('#fname', '已選擇：example.png');
  if (preset === 'error') text('#fname', '檔案超過 10 MB，請重新選擇');
});
