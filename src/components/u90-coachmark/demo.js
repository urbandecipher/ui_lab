// U90 新手教學聚焦 — Coachmark，聚光燈標示功能，逐步說明並可隨時略過
UILab.define(90, ({preset, uid, q, all, on, later, make, say}) => {
  const STEPS = [
    ['建立第一個專案', '從這裡新增專案，範本會自動帶入常用設定。'],
    ['快速找到內容', '輸入名稱或標籤就能搜尋所有專案。'],
    ['個人化設定', '在設定裡調整通知、語言與外觀。'],
  ];
  const stage = q('.cm-stage'),
    toolbar = q('.cm-toolbar'),
    start = q('.cm-start'),
    targets = all('.cm-t');
  let step = -1,
    spot = null,
    tip = null;
  function place() {
    const t = targets[step];
    const s = stage.getBoundingClientRect(),
      r = t.getBoundingClientRect();
    const pad = 4;
    Object.assign(spot.style, {
      left: r.left - s.left - pad + 'px',
      top: r.top - s.top - pad + 'px',
      width: r.width + pad * 2 + 'px',
      height: r.height + pad * 2 + 'px',
    });
    tip.style.top = r.bottom - s.top + 14 + 'px';
  }
  function render() {
    const [title, body] = STEPS[step];
    tip.querySelector('.cm-step').textContent = '步驟 ' + (step + 1) + ' / ' + STEPS.length;
    tip.querySelector('h4').textContent = title;
    tip.querySelector('p').textContent = body;
    tip.querySelector('.cm-back').disabled = step === 0;
    tip.querySelector('.cm-next').textContent = step === STEPS.length - 1 ? '完成' : '下一步';
    place();
    tip.querySelector('.cm-next').focus();
  }
  function open() {
    if (tip) return;
    step = 0;
    // The rest of the stage is out of reach while the tour runs.
    toolbar.inert = true;
    q('.cm-content').inert = true;
    start.disabled = true;
    spot = make('div', undefined, 'cm-spot');
    spot.setAttribute('aria-hidden', 'true');
    tip = make('div', undefined, 'cm-tip');
    const titleId = uid('cm-title');
    tip.setAttribute('role', 'dialog');
    tip.setAttribute('aria-labelledby', titleId);
    tip.innerHTML =
      '<span class="cm-step"></span><h4></h4><p></p><div class="cm-actions"><button type="button" class="catalog-button cm-skip">略過導覽</button><button type="button" class="catalog-button cm-back">上一步</button><button type="button" class="btn btn-primary cm-next"></button></div>';
    tip.querySelector('h4').id = titleId;
    stage.append(spot, tip);
    on(tip.querySelector('.cm-skip'), 'click', () => close('已略過導覽'));
    on(tip.querySelector('.cm-back'), 'click', () => go(step - 1));
    on(tip.querySelector('.cm-next'), 'click', () => (step === STEPS.length - 1 ? close('導覽完成') : go(step + 1)));
    on(tip, 'keydown', e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close('已略過導覽');
      } else if (e.key === 'ArrowRight' && step < STEPS.length - 1) go(step + 1);
      else if (e.key === 'ArrowLeft' && step > 0) go(step - 1);
      else if (e.key === 'Tab') {
        // Keep focus inside the tip while the tour is open.
        const btns = [...tip.querySelectorAll('button:not(:disabled)')];
        const i = btns.indexOf(e.target);
        const wrapTo =
          e.shiftKey && i === 0 ? btns[btns.length - 1] : !e.shiftKey && i === btns.length - 1 ? btns[0] : null;
        if (wrapTo) {
          e.preventDefault();
          wrapTo.focus();
        }
      }
    });
    render();
    say('導覽開始，步驟 1：' + STEPS[0][0]);
  }
  function go(i) {
    step = i;
    render();
    say('步驟 ' + (step + 1) + '：' + STEPS[step][0]);
  }
  function close(message) {
    spot?.remove();
    tip?.remove();
    spot = tip = null;
    toolbar.inert = false;
    q('.cm-content').inert = false;
    start.disabled = false;
    start.focus();
    say(message);
  }
  on(start, 'click', open);
  if (preset === 'active') later(open, 0);
});
