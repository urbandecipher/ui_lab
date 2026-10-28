// U82 圖片燈箱 — Lightbox，縮圖放大檢視、左右切換、關閉後回到縮圖
UILab.define(82, ({preset, uid, doc, q, portals, on, later, attrs, make, say}) => {
  const PHOTOS = [
    ['晨光海岸', 18],
    ['山間步道', 130],
    ['城市夜景', 230],
    ['秋日楓林', 28],
    ['湖畔小屋', 190],
    ['沙漠星空', 260],
  ];
  const grid = q('.lb-grid');
  grid.setAttribute('aria-label', '相片集');
  const thumbs = PHOTOS.map(([caption, hue], i) => {
    const li = make('li');
    const b = make('button', caption, 'lb-thumb');
    b.type = 'button';
    b.style.setProperty('--h', hue);
    b.setAttribute('aria-label', '放大檢視：' + caption + '（第 ' + (i + 1) + ' 張，共 ' + PHOTOS.length + ' 張）');
    on(b, 'click', () => open(i));
    li.append(b);
    grid.append(li);
    return b;
  });
  let dialog = null,
    index = 0;
  function show(i) {
    index = (i + PHOTOS.length) % PHOTOS.length;
    const [caption, hue] = PHOTOS[index];
    dialog.querySelector('.lb-stage').style.setProperty('--h', hue);
    const img = dialog.querySelector('.lb-stage');
    img.setAttribute('aria-label', caption);
    dialog.querySelector('.lb-caption').textContent = caption;
    dialog.querySelector('.lb-count').textContent = index + 1 + ' / ' + PHOTOS.length;
    say(caption + '，第 ' + (index + 1) + ' 張');
  }
  function open(i) {
    dialog = make('dialog', undefined, 'lb-dialog');
    const title = uid('lb-caption');
    dialog.setAttribute('aria-labelledby', title);
    const stage = make('div', undefined, 'lb-stage');
    attrs(stage, {role: 'img'});
    const prev = make('button', '‹', 'lb-nav lb-prev'),
      next = make('button', '›', 'lb-nav lb-next');
    prev.type = next.type = 'button';
    prev.setAttribute('aria-label', '上一張');
    next.setAttribute('aria-label', '下一張');
    stage.append(prev, next);
    const bar = make('div', undefined, 'lb-bar');
    const caption = make('span', '', 'lb-caption');
    caption.id = title;
    const close = make('button', '關閉', 'catalog-button');
    close.type = 'button';
    bar.append(caption, make('span', '', 'lb-count'), close);
    dialog.append(stage, bar);
    on(prev, 'click', () => show(index - 1));
    on(next, 'click', () => show(index + 1));
    on(close, 'click', () => dialog.close());
    on(dialog, 'keydown', e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        show(index + (e.key === 'ArrowRight' ? 1 : -1));
      }
    });
    on(dialog, 'click', e => e.target === dialog && dialog.close());
    let startX = null;
    on(stage, 'pointerdown', e => (startX = e.clientX));
    on(stage, 'pointerup', e => {
      if (startX !== null && Math.abs(e.clientX - startX) > 40) show(index + (e.clientX < startX ? 1 : -1));
      startX = null;
    });
    on(dialog, 'close', () => {
      dialog.remove();
      portals.delete(dialog);
      thumbs[index].focus(); // return to the photo the user ended on
      dialog = null;
    });
    doc.body.append(dialog);
    portals.add(dialog);
    show(i);
    dialog.showModal();
    close.focus();
  }
  if (preset === 'expanded') later(() => open(2), 0);
});
