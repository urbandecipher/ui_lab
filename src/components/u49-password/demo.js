// U49 密碼欄位 — Password，顯示切換與強度提示
UILab.define(49, ({preset, uid, doc, q, all, on, attrs}) => {
  const input = q('.pw-input'),
    toggle = q('.pw-toggle'),
    bars = all('.pw-meter span'),
    meter = q('.pw-meter'),
    msg = q('.pw-msg');
  input.id = uid('pw');
  q('.pw-wrap label').htmlFor = input.id;
  msg.id = uid('pw-msg');
  attrs(input, {'aria-describedby': msg.id});
  attrs(msg, {'aria-live': 'polite'});
  attrs(toggle, {'aria-pressed': false, 'aria-controls': input.id, 'aria-label': '顯示密碼'});
  const levels = ['太弱', '偏弱', '普通', '良好', '強'];
  const rate = () => {
    const v = input.value;
    let score = 0;
    if (v.length >= 8) score++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score++;
    if (/\d/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    if (v.length < 8) score = Math.min(score, 1);
    bars.forEach((b, i) => b.classList.toggle('on', i < score));
    meter.dataset.level = score;
    msg.textContent = v
      ? '強度：' + levels[score] + (v.length < 8 ? '，至少需要 8 個字元' : '')
      : '至少 8 個字元，建議混合大小寫、數字與符號';
    msg.classList.toggle('error', !!v && score < 2);
    msg.classList.toggle('success', !!v && score >= 3);
    input.setAttribute('aria-invalid', !!v && v.length < 8);
  };
  on(input, 'input', rate);
  on(toggle, 'click', () => {
    const show = input.type === 'password';
    const start = input.selectionStart,
      end = input.selectionEnd;
    input.type = show ? 'text' : 'password';
    toggle.textContent = show ? '隱藏' : '顯示';
    attrs(toggle, {'aria-pressed': show, 'aria-label': show ? '隱藏密碼' : '顯示密碼'});
    if (doc.activeElement === input && start !== null) input.setSelectionRange(start, end);
  });
  if (preset === 'error') input.value = 'abc';
  if (preset === 'success') input.value = 'Sunrise#2026';
  rate();
});
