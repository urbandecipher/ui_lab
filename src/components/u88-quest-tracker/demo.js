// U88 任務追蹤 — Quest Tracker，追蹤中任務的目標與進度，可切換與收合
UILab.define(88, ({preset, uid, q, on, text, attrs, make, say}) => {
  const QUESTS = [
    {
      name: '霧之森的委託',
      goals: [
        ['與村長交談', 0, 1],
        ['擊敗史萊姆', 2, 5],
        ['帶回藥草', 0, 3],
      ],
    },
    {
      name: '港都的走私案',
      goals: [
        ['調查倉庫', 0, 1],
        ['找出帳本', 0, 1],
      ],
    },
  ];
  const pick = q('.qt-pick'),
    panel = q('.qt-panel'),
    goals = q('.qt-goals'),
    collapse = q('.qt-collapse'),
    progress = q('.qt-progress');
  let current = 0,
    collapsed = false;
  panel.id = uid('qt-panel');
  attrs(collapse, {'aria-controls': panel.id, 'aria-expanded': true});
  attrs(goals, {'aria-label': '任務目標'});
  QUESTS.forEach((qst, i) => {
    const o = make('option', qst.name);
    o.value = i;
    pick.append(o);
  });
  const quest = () => QUESTS[current];
  const isDone = g => g[1] >= g[2];
  function render() {
    text('.qt-title', quest().name);
    goals.replaceChildren();
    quest().goals.forEach(g => {
      const li = make('li', undefined, 'qt-goal' + (isDone(g) ? ' done' : ''));
      const box = make('span', isDone(g) ? '✓' : '', 'qt-box');
      box.setAttribute('aria-hidden', 'true');
      li.append(box, make('span', g[0]));
      if (g[2] > 1) li.append(make('span', g[1] + '/' + g[2], 'qt-count'));
      li.append(make('span', isDone(g) ? '，已完成' : '，未完成', 'sr-only'));
      goals.append(li);
    });
    panel.querySelector('.qt-complete')?.remove();
    const all = quest().goals.every(isDone);
    if (all) panel.append(make('p', '任務完成！回報給委託人', 'qt-complete'));
    progress.disabled = all;
  }
  on(pick, 'change', () => {
    current = Number(pick.value);
    render();
    say('改為追蹤：' + quest().name);
  });
  on(collapse, 'click', () => {
    collapsed = !collapsed;
    panel.hidden = collapsed;
    collapse.textContent = collapsed ? '展開' : '收合';
    collapse.setAttribute('aria-expanded', !collapsed);
  });
  on(progress, 'click', () => {
    const g = quest().goals.find(x => !isDone(x));
    if (!g) return;
    g[1]++;
    render();
    if (isDone(g)) say('目標完成：' + g[0] + (quest().goals.every(isDone) ? '。任務完成！' : ''));
    else say(g[0] + ' ' + g[1] + '/' + g[2]);
  });
  if (preset === 'complete') QUESTS[0].goals.forEach(g => (g[1] = g[2]));
  render();
  if (preset === 'collapsed') collapse.click();
});
