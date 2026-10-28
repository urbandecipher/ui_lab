// U45 單選群組 — Radio Group，互斥選項全部可見
UILab.define(45, ({preset, all, on, say}) => {
  const radios = all('input[type="radio"]');
  radios.forEach(r =>
    on(r, 'change', () => {
      if (r.checked) say('已選擇「' + r.value + '」方案');
    }),
  );
  radios[preset === 'selected' ? 1 : 0].checked = true;
});
