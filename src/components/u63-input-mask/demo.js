// U63 輸入遮罩 — Input Mask，手機與身分證自動格式化
UILab.define(63, ({preset, uid, all, on, attrs}) => {
  // 身分證字母代碼：依序對應 10–35（I、O、W 等字母的代碼不照字母順序）
  const LETTERS = 'ABCDEFGHJKLMNPQRSTUVXYWZIO';
  const twIdValid = id => {
    if (!/^[A-Z][1289]\d{8}$/.test(id)) return false;
    const code = LETTERS.indexOf(id[0]) + 10;
    let sum = Math.floor(code / 10) + (code % 10) * 9;
    for (let i = 1; i <= 8; i++) sum += Number(id[i]) * (9 - i);
    return (sum + Number(id[9])) % 10 === 0;
  };
  const MASKS = {
    phone: {
      max: 10,
      accept: (ch, kept) => /\d/.test(ch),
      format: v => [v.slice(0, 4), v.slice(4, 7), v.slice(7, 10)].filter(Boolean).join('-'),
      hint: '格式：09XX-XXX-XXX',
      check: v => (v.startsWith('09') ? '' : '手機號碼須以 09 開頭'),
      incomplete: n => '號碼不完整，還差 ' + n + ' 碼',
      ok: '格式正確',
    },
    'tw-id': {
      max: 10,
      accept: (ch, kept) => (kept.length === 0 ? /[a-z]/i.test(ch) : /\d/.test(ch)),
      format: v => v,
      hint: '1 個英文字母 + 9 位數字',
      check: v =>
        !/^[A-Z][1289]/.test(v) ? '第 2 碼須為 1、2、8 或 9' : twIdValid(v) ? '' : '檢查碼不符，請確認是否輸入錯誤',
      incomplete: n => '字號不完整，還差 ' + n + ' 碼',
      ok: '檢查碼正確',
    },
  };

  all('.mask-field').forEach(wrap => {
    const mask = MASKS[wrap.dataset.mask];
    const input = wrap.querySelector('input'),
      label = wrap.querySelector('label'),
      msg = wrap.querySelector('.field-msg');
    input.id = uid('mask-' + wrap.dataset.mask);
    msg.id = input.id + '-msg';
    label.htmlFor = input.id;
    attrs(input, {'aria-describedby': msg.id});
    attrs(msg, {role: 'status'});

    // Keep only accepted characters, uppercase letters, cap length.
    const clean = raw => {
      let kept = '';
      for (const ch of raw) if (kept.length < mask.max && mask.accept(ch, kept)) kept += ch.toUpperCase();
      return kept;
    };
    // Position in the formatted text right after the n-th kept character.
    const caretAfter = (formatted, n) => {
      if (n === 0) return 0;
      let seen = 0;
      for (let i = 0; i < formatted.length; i++) if (/[0-9A-Z]/.test(formatted[i]) && ++seen === n) return i + 1;
      return formatted.length;
    };
    const setMessage = (kind, textValue) => {
      if (msg.textContent !== textValue) msg.textContent = textValue;
      msg.className = 'field-msg' + (kind ? ' ' + kind : '');
      wrap.classList.toggle('error', kind === 'error');
      wrap.classList.toggle('success', kind === 'success');
      input.setAttribute('aria-invalid', kind === 'error');
    };
    const validate = final => {
      const v = clean(input.value);
      if (!v) return setMessage('', mask.hint);
      if (v.length < mask.max)
        return final ? setMessage('error', mask.incomplete(mask.max - v.length)) : setMessage('', mask.hint);
      const problem = mask.check(v);
      setMessage(problem ? 'error' : 'success', problem || mask.ok);
    };
    const apply = (raw, caret) => {
      const kept = clean(raw);
      const before = clean(raw.slice(0, caret)).length;
      input.value = mask.format(kept);
      if (input.ownerDocument.activeElement === input) {
        const pos = caretAfter(input.value, Math.min(before, kept.length));
        input.setSelectionRange(pos, pos);
      }
      validate(false);
    };
    on(input, 'input', () => apply(input.value, input.selectionStart ?? input.value.length));
    // Backspace right after a separator deletes the character before it.
    on(input, 'keydown', e => {
      const at = input.selectionStart;
      if (e.key !== 'Backspace' || at !== input.selectionEnd || at < 2 || input.value[at - 1] !== '-') return;
      e.preventDefault();
      apply(input.value.slice(0, at - 2) + input.value.slice(at), at - 2);
    });
    on(input, 'blur', () => validate(true));
    if (preset === 'success') input.value = mask.format(wrap.dataset.mask === 'phone' ? '0912345678' : 'A123456789');
    if (preset === 'error') input.value = mask.format(wrap.dataset.mask === 'phone' ? '0812345678' : 'A123456788');
    validate(preset !== 'default');
  });
});
