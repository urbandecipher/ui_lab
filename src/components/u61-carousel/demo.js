// U61 輪播 — Carousel，自動播放可暫停、支援滑動
UILab.define(61, ({preset, uid, doc, win, q, all, timers, on, later, isReducedMotion, attrs, make}) => {
  const slides = [
      ['新功能上線', '全新儀表板，重點數據一目了然', 215],
      ['限時活動', '本週訂閱享 8 折優惠', 330],
      ['使用技巧', '按 Ctrl／⌘ K 快速搜尋指令', 150],
      ['社群精選', '看看其他人如何運用範本', 35],
    ],
    region = q('.carousel'),
    viewport = q('.car-viewport'),
    track = q('.car-track'),
    dots = q('.car-dots'),
    [prev, next] = all('.car-nav'),
    play = q('.car-play');
  let index = 0,
    playing = !isReducedMotion(),
    paused = false,
    timer = null;
  viewport.id = uid('car-viewport');
  slides.forEach(([title, sub, hue], i) => {
    const slide = make('div', undefined, 'car-slide');
    attrs(slide, {
      role: 'group',
      'aria-roledescription': 'slide',
      'aria-label': i + 1 + ' / ' + slides.length + '：' + title,
    });
    slide.style.setProperty('--h', hue);
    slide.append(make('strong', title), make('span', sub));
    track.append(slide);
    const dot = make('button', '', 'car-dot');
    dot.type = 'button';
    attrs(dot, {'aria-label': '第 ' + (i + 1) + ' 張：' + title, 'aria-controls': viewport.id});
    on(dot, 'click', () => go(i));
    dots.append(dot);
  });
  attrs(prev, {'aria-label': '上一張', 'aria-controls': viewport.id});
  attrs(next, {'aria-label': '下一張', 'aria-controls': viewport.id});
  const schedule = () => {
    win.clearTimeout(timer);
    timers.delete(timer);
    timer = null;
    if (playing && !paused && !doc.hidden) timer = later(() => go(index + 1), 4500);
  };
  const go = i => {
    index = (i + slides.length) % slides.length;
    track.style.transform = 'translateX(' + -index * 100 + '%)';
    all('.car-slide').forEach((s, j) => {
      s.inert = j !== index;
      s.setAttribute('aria-hidden', String(j !== index));
    });
    all('.car-dot').forEach((d, j) => {
      d.classList.toggle('active', j === index);
      if (j === index) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
    schedule();
  };
  const renderPlay = () => {
    play.textContent = playing ? '暫停' : '播放';
    play.setAttribute('aria-label', playing ? '暫停自動輪播' : '開始自動輪播');
    viewport.setAttribute('aria-live', playing ? 'off' : 'polite');
  };
  on(prev, 'click', () => go(index - 1));
  on(next, 'click', () => go(index + 1));
  on(play, 'click', () => {
    playing = !playing;
    renderPlay();
    schedule();
  });
  on(region, 'pointerenter', () => {
    paused = true;
    schedule();
  });
  on(region, 'pointerleave', () => {
    paused = region.contains(doc.activeElement);
    schedule();
  });
  on(region, 'focusin', () => {
    paused = true;
    schedule();
  });
  on(region, 'focusout', e => {
    if (!region.contains(e.relatedTarget)) {
      paused = false;
      schedule();
    }
  });
  on(doc, 'visibilitychange', schedule);
  let startX = null;
  on(viewport, 'pointerdown', e => {
    startX = e.clientX;
  });
  on(viewport, 'pointerup', e => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
  });
  on(viewport, 'pointercancel', () => {
    startX = null;
  });
  on(region, 'keydown', e => {
    if (e.target.tagName === 'BUTTON' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      go(index + (e.key === 'ArrowRight' ? 1 : -1));
    }
  });
  on(doc, 'uilab-style-change', () => {
    if (isReducedMotion() && playing) {
      playing = false;
      renderPlay();
      schedule();
    }
  });
  renderPlay();
  go(preset === 'selected' ? 2 : 0);
});
