// U18 步驟精靈 — Stepper，多步驟流程進度
UILab.define(18, ({preset, all, on}) => {
  let step = preset === 'success' ? 3 : 1;
  const items = all('.step'),
    buttons = all('.module-body button');
  const render = () => {
    items.forEach((el, i) => {
      el.classList.toggle('active', i === step);
      el.classList.toggle('done', i < step);
      if (i === step) el.setAttribute('aria-current', 'step');
      else el.removeAttribute('aria-current');
      el.querySelector('.circle').textContent = i < step ? '✓' : i + 1;
    });
    buttons[0].disabled = step === 0;
    buttons[1].disabled = step === items.length - 1;
  };
  buttons.forEach((b, i) =>
    on(b, 'click', () => {
      step = Math.max(0, Math.min(items.length - 1, step + (i ? 1 : -1)));
      render();
    }),
  );
  render();
});
