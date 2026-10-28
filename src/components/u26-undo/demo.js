// U26 復原提示 — Undo Snackbar，操作後提供反悔機會
UILab.define(26, ({preset, doc, win, q, on, later, make, body, say, control}) => {
  const launch = q('button'),
    item = make('p', '示範項目', 'demo-item'),
    bar = make('div', undefined, 'demo-undo');
  body.prepend(item);
  body.append(bar);
  let timer;
  on(launch, 'click', () => {
    if (item.hidden) return;
    item.hidden = true;
    bar.replaceChildren(make('span', '項目已刪除 '));
    const undo = control(
      '撤銷',
      () => {
        win.clearTimeout(timer);
        item.hidden = false;
        bar.replaceChildren();
        say('項目已復原');
      },
      bar,
    );
    say('項目已刪除，可在 8 秒內撤銷');
    timer = later(() => {
      if (bar.contains(doc.activeElement)) launch.focus();
      bar.replaceChildren();
    }, 8000);
  });
  if (preset === 'deleted') launch.click();
});
