// 總則：無障礙檢查清單的勾選進度（只存在這個瀏覽器，讀寫失敗也不影響使用）。
(() => {
  const section = document.getElementById('guidelines');
  if (!section) return;
  const key = 'ui-lab-a11y-checklist:' + location.pathname;
  const boxes = [...section.querySelectorAll('.gl-item input[type="checkbox"]')];
  const progress = section.querySelector('.gl-progress');
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(key) || '{}');
  } catch {}
  const render = () => {
    const done = boxes.filter(b => b.checked).length;
    progress.textContent = '已確認 ' + done + ' / ' + boxes.length;
    progress.classList.toggle('complete', done === boxes.length);
  };
  const persist = () => {
    try {
      localStorage.setItem(key, JSON.stringify(Object.fromEntries(boxes.map(b => [b.dataset.key, b.checked]))));
    } catch {}
  };
  boxes.forEach(b => {
    b.checked = !!saved[b.dataset.key];
    b.addEventListener('change', () => {
      render();
      persist();
    });
  });
  section.querySelector('.gl-reset').addEventListener('click', () => {
    boxes.forEach(b => (b.checked = false));
    render();
    persist();
  });
  render();
})();
