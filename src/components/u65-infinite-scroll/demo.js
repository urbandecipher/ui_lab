// U65 無限捲動 — Infinite Scroll，自動載入並保留「載入更多」按鈕
UILab.define(65, ({preset, win, q, abort, on, later, attrs, make, say}) => {
  const TOTAL = 24,
    PER_PAGE = 8;
  const TOPICS = [
    '發布了新的設計稿',
    '留言回覆了你的問題',
    '更新了專案進度',
    '分享了一篇文章',
    '完成了一項任務',
    '加入了團隊頻道',
  ];
  const NAMES = ['陳怡君', '王志明', '李佳穎', '張家豪', '林雅婷', '黃俊傑'];
  const viewport = q('.feed-viewport'),
    list = q('.feed-list'),
    sentinel = q('.feed-sentinel'),
    status = q('.feed-status'),
    more = q('.feed-more');
  let loaded = 0,
    loading = false,
    failed = false,
    failNext = preset === 'error';
  attrs(viewport, {tabindex: 0, role: 'region', 'aria-label': '動態消息，可捲動'});
  attrs(list, {'aria-label': '動態消息'});

  const item = n => {
    const li = make('li', undefined, 'feed-item');
    const dot = make('span', undefined, 'feed-dot');
    dot.style.setProperty('--h', (n * 47) % 360);
    dot.setAttribute('aria-hidden', 'true');
    const body = make('div');
    body.append(
      make('strong', NAMES[n % NAMES.length] + ' ' + TOPICS[n % TOPICS.length]),
      make('span', n + 1 + ' 分鐘前'),
    );
    li.append(dot, body);
    return li;
  };
  const placeholder = () => {
    const li = make('li', undefined, 'feed-item feed-loading');
    li.setAttribute('aria-hidden', 'true');
    const dot = make('span', undefined, 'feed-dot');
    const body = make('div');
    body.style.flex = '1';
    body.append(make('span', undefined, 'feed-bar'), make('span', undefined, 'feed-bar'));
    li.append(dot, body);
    return li;
  };
  const render = () => {
    const done = loaded >= TOTAL;
    status.textContent = done ? '已顯示全部 ' + TOTAL + ' 筆' : '已顯示 ' + loaded + ' / ' + TOTAL + ' 筆';
    more.hidden = done || failed;
    more.disabled = loading;
    more.textContent = loading ? '載入中…' : '載入更多';
    list.setAttribute('aria-busy', loading);
  };
  function load({forever = false} = {}) {
    if (loading || failed || loaded >= TOTAL) return;
    loading = true;
    const skeletons = [placeholder(), placeholder()];
    list.append(...skeletons);
    render();
    say('載入中…');
    if (forever) return;
    later(() => {
      skeletons.forEach(el => el.remove());
      loading = false;
      if (failNext) {
        failNext = false;
        failed = true;
        const err = make('li', undefined, 'feed-error');
        err.append(make('span', '載入失敗，已顯示的內容不受影響。'));
        const retry = make('button', '重試', 'catalog-button');
        retry.type = 'button';
        on(retry, 'click', () => {
          err.remove();
          failed = false;
          render();
          more.focus();
          load();
        });
        err.append(retry);
        list.append(err);
        render();
        say('載入失敗，可按重試');
        return;
      }
      const from = loaded;
      loaded = Math.min(TOTAL, loaded + PER_PAGE);
      for (let n = from; n < loaded; n++) list.append(item(n));
      if (loaded >= TOTAL) list.append(make('li', '已經到底了', 'feed-end'));
      render();
      say('已載入 ' + (loaded - from) + ' 筆，共顯示 ' + loaded + ' 筆');
    }, 700);
  }

  // Auto-load when the end of the list scrolls into view inside the viewport.
  if ('IntersectionObserver' in win) {
    const observer = new win.IntersectionObserver(entries => entries.some(e => e.isIntersecting) && load(), {
      root: viewport,
      rootMargin: '0px 0px 60px 0px',
    });
    observer.observe(sentinel);
    abort.signal.addEventListener('abort', () => observer.disconnect());
  }
  on(more, 'click', () => load());

  // First page is part of the initial render.
  for (let n = 0; n < PER_PAGE; n++) list.append(item(n));
  loaded = PER_PAGE;
  if (preset === 'end') {
    for (let n = loaded; n < TOTAL; n++) list.append(item(n));
    loaded = TOTAL;
    list.append(make('li', '已經到底了', 'feed-end'));
  }
  render();
  if (preset === 'loading') load({forever: true});
  if (preset === 'error') load();
});
