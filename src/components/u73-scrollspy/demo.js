// U73 目錄捲動追蹤 — Scrollspy，捲動時標示目前段落，點目錄跳到段落並移動焦點
UILab.define(73, ({preset, win, q, all, abort, on, say}) => {
  const body = q('.ss-body'),
    links = all('.ss-toc a'),
    sections = all('.ss-body section');
  let current = null;
  const linkFor = section => links.find(a => a.getAttribute('href') === '#' + section.id);
  function mark(section) {
    if (current === section) return;
    current = section;
    links.forEach(a => a.removeAttribute('aria-current'));
    linkFor(section)?.setAttribute('aria-current', 'location');
  }
  // The topmost section whose heading has passed the top 40% of the viewport is "current".
  function update() {
    const top = body.getBoundingClientRect().top + body.clientHeight * 0.4;
    let active = sections[0];
    for (const s of sections) if (s.getBoundingClientRect().top <= top) active = s;
    if (body.scrollTop + body.clientHeight >= body.scrollHeight - 2) active = sections[sections.length - 1];
    mark(active);
  }
  if ('IntersectionObserver' in win) {
    const io = new win.IntersectionObserver(update, {root: body, threshold: [0, 0.25, 0.5, 0.75, 1]});
    sections.forEach(s => io.observe(s));
    abort.signal.addEventListener('abort', () => io.disconnect());
  }
  on(body, 'scroll', update, {passive: true});
  links.forEach(a =>
    on(a, 'click', e => {
      e.preventDefault();
      const section = sections.find(s => '#' + s.id === a.getAttribute('href'));
      const heading = section.querySelector('h4');
      heading.tabIndex = -1;
      body.scrollTo({top: section.offsetTop});
      heading.focus({preventScroll: true});
      mark(section);
      say('已跳到「' + heading.textContent + '」');
    }),
  );
  if (preset === 'selected') body.scrollTop = sections[2].offsetTop;
  update();
});
