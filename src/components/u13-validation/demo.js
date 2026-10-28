// U13 表單驗證 — 即時輸入驗證回饋
UILab.define(13, ({preset, uid, q, on}) => {
  const input = q('input'),
    wrap = q('#fieldWrap'),
    msg = q('#fieldMsg');
  input.id = uid('code-input');
  q('label').htmlFor = input.id;
  input.setAttribute('aria-describedby', msg.id);
  msg.setAttribute('role', 'status');
  const validate = () => {
    const v = input.value.trim(),
      ok = /^[A-Z]{2}-\d{3}$/.test(v);
    wrap.classList.toggle('error', !!v && !ok);
    wrap.classList.toggle('success', !!v && ok);
    input.setAttribute('aria-invalid', !!v && !ok);
    msg.textContent = !v ? '' : ok ? '格式正確' : '格式須為「XX-000」，例如 AB-123';
    msg.className = 'field-msg ' + (!v ? '' : ok ? 'success' : 'error');
  };
  on(input, 'input', validate);
  if (preset === 'success') input.value = 'AB-123';
  if (preset === 'error') input.value = 'invalid';
  validate();
});
