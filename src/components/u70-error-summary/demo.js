// U70 表單錯誤摘要 — Error Summary，送出後集中列出錯誤並可跳到欄位
UILab.define(70, ({preset, uid, q, all, on, attrs, make, say}) => {
  const form = q('.es-form'),
    summary = q('.es-summary'),
    title = q('.es-title'),
    list = q('.es-list'),
    done = q('.es-done');
  const RULES = {
    name: v => (!v.trim() ? '請輸入姓名' : ''),
    email: v =>
      !v.trim()
        ? '請輸入電子郵件'
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
          ? '電子郵件格式應為 name@example.com'
          : '',
    terms: (v, el) => (!el.checked ? '請勾選同意服務條款' : ''),
  };
  const fields = all('.es-field').map(wrap => {
    const key = wrap.dataset.field,
      input = wrap.querySelector('input'),
      msg = wrap.querySelector('.field-msg');
    input.id = uid('es-' + key);
    msg.id = input.id + '-msg';
    const label = wrap.querySelector(':scope > label');
    if (label) label.htmlFor = input.id;
    input.setAttribute('aria-describedby', msg.id);
    return {key, wrap, input, msg, label: (label || wrap.querySelector('label')).textContent.trim()};
  });
  q('.es-submit').type = 'submit'; // core sets every button to type=button; this one must submit
  title.id = uid('es-title');
  attrs(summary, {tabindex: -1, role: 'region', 'aria-labelledby': title.id});

  const check = f => RULES[f.key](f.input.value, f.input);
  const mark = (f, message) => {
    f.msg.textContent = message;
    f.msg.className = 'field-msg' + (message ? ' error' : '');
    f.wrap.classList.toggle('error', !!message);
    f.input.setAttribute('aria-invalid', !!message);
  };
  function validate({focus}) {
    const errors = fields.map(f => [f, check(f)]).filter(([, m]) => m);
    fields.forEach(f => mark(f, errors.find(([g]) => g === f)?.[1] || ''));
    list.replaceChildren();
    errors.forEach(([f, message]) => {
      const li = make('li');
      const a = make('a', message);
      a.href = '#' + f.input.id;
      on(a, 'click', e => {
        e.preventDefault();
        f.input.focus();
      });
      li.append(a);
      list.append(li);
    });
    summary.hidden = !errors.length;
    title.textContent = '請修正 ' + errors.length + ' 個問題後再送出';
    done.hidden = !!errors.length;
    if (errors.length && focus) summary.focus();
    if (!errors.length) say('已送出');
    return errors.length;
  }
  on(form, 'submit', e => {
    e.preventDefault();
    validate({focus: true});
  });
  // After the first attempt, fixing a field clears its inline error immediately.
  fields.forEach(f =>
    on(f.input, f.key === 'terms' ? 'change' : 'input', () => {
      if (f.wrap.classList.contains('error') && !check(f)) mark(f, '');
    }),
  );
  if (preset === 'error') {
    fields[1].input.value = 'order@';
    validate({focus: false});
  }
  if (preset === 'success') {
    fields[0].input.value = '林小安';
    fields[1].input.value = 'an@example.com';
    fields[2].input.checked = true;
    validate({focus: false});
  }
});
