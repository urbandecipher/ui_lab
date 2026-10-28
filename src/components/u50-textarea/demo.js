// U50 多行文字 — Textarea，自動延展與字數上限
UILab.define(50, ({preset, uid, q, on, later, attrs, say}) => {
  const ta = q('.ta-input'),
    count = q('.ta-count');
  ta.id = uid('ta');
  q('label').htmlFor = ta.id;
  count.id = uid('ta-count');
  attrs(ta, {'aria-describedby': count.id});
  const limit = Number(ta.maxLength) || 120;
  let warned = false;
  const render = () => {
    ta.style.height = 'auto';
    if (ta.scrollHeight) ta.style.height = Math.min(ta.scrollHeight + 2, 180) + 'px';
    else ta.style.height = '';
    const n = ta.value.length;
    count.textContent = n + ' / ' + limit;
    count.classList.toggle('warn', n >= limit * 0.85);
  };
  on(ta, 'input', () => {
    render();
    const n = ta.value.length;
    if (n >= limit * 0.85 && !warned) {
      warned = true;
      say('剩餘 ' + (limit - n) + ' 字');
    }
    if (n < limit * 0.85) warned = false;
  });
  if (preset === 'maximum')
    ta.value = '這是一段較長的示範文字，用來觀察高度延展與字數上限的提示。'.repeat(5).slice(0, limit);
  render();
  later(render, 0);
});
