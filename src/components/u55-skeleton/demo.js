// U55 骨架屏 — Skeleton，載入期間保留版面結構
UILab.define(55, ({preset, q, on, later, say}) => {
  const holder = q('.skel-holder'),
    sk = q('.skel-card'),
    real = q('.skel-real'),
    b = q('.skel-reload');
  let busy = false;
  const done = () => {
    busy = false;
    holder.setAttribute('aria-busy', 'false');
    sk.hidden = true;
    real.hidden = false;
    b.disabled = false;
  };
  const load = (quiet, forever) => {
    if (busy) return;
    busy = true;
    holder.setAttribute('aria-busy', 'true');
    sk.hidden = false;
    real.hidden = true;
    b.disabled = true;
    if (!quiet) say('載入中…');
    if (!forever)
      later(() => {
        done();
        if (!quiet) say('內容已載入');
      }, 1600);
  };
  on(b, 'click', () => load(false, false));
  if (preset === 'success') done();
  else load(true, preset === 'loading');
});
