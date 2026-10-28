// U19 驗證碼輸入 — OTP / PIN，自動跳至下一格
UILab.define(19, ({preset, all, on, attrs, say}) => {
  const inputs = all('#otpRow input');
  inputs.forEach((el, i) => {
    attrs(el, {
      'aria-label': '驗證碼第 ' + (i + 1) + ' 位',
      inputmode: 'numeric',
      autocomplete: i === 0 ? 'one-time-code' : 'off',
    });
    on(el, 'input', () => {
      el.value = el.value.replace(/\D/g, '').slice(-1);
      if (el.value) inputs[i + 1]?.focus();
      say(inputs.every(it => it.value) ? '驗證碼已輸入完成' : '');
    });
    on(el, 'keydown', e => {
      if (e.key === 'Backspace' && !el.value) inputs[i - 1]?.focus();
      if (e.key === 'ArrowLeft') inputs[i - 1]?.focus();
      if (e.key === 'ArrowRight') inputs[i + 1]?.focus();
    });
    on(el, 'paste', e => {
      e.preventDefault();
      const digits = e.clipboardData.getData('text').replace(/\D/g, '');
      inputs.slice(i).forEach((it, j) => (it.value = digits[j] || ''));
      inputs[Math.min(i + digits.length, inputs.length - 1)].focus();
      say(inputs.every(it => it.value) ? '驗證碼已輸入完成' : '');
    });
    if (preset === 'success') el.value = String(i + 1);
  });
});
