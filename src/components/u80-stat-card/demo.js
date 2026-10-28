// U80 統計數字卡 — Stat Card，數值、變化量與趨勢線，切換區間時補間更新
UILab.define(80, ({preset, doc, all, q, attrs, make, say, animate, isReducedMotion, choiceGroup}) => {
  const DATA = {
    本週: [
      ['營收', 128400, 'NT$', 12.4, [8, 9, 7, 11, 12, 10, 14]],
      ['訂單', 342, '', 5.1, [40, 44, 41, 52, 48, 55, 62]],
      ['退貨率', 2.8, '%', -0.6, [3.6, 3.4, 3.5, 3.1, 3.0, 2.9, 2.8]],
    ],
    本月: [
      ['營收', 512900, 'NT$', -3.2, [130, 118, 125, 140]],
      ['訂單', 1388, '', 8.7, [300, 330, 352, 406]],
      ['退貨率', 3.1, '%', 0.4, [2.7, 2.9, 3.0, 3.1]],
    ],
  };
  // For return rate a decrease is good: "better" decides colour, the sign decides the arrow.
  const LOWER_IS_BETTER = new Set(['退貨率']);
  const grid = q('.st-grid'),
    tabs = all('.st-tab');
  let period = '本週',
    shown = {};
  const fmt = (v, unit) =>
    unit === '%' ? v.toFixed(1) + '%' : (unit ? unit + ' ' : '') + Math.round(v).toLocaleString('en-US');
  const spark = values => {
    const min = Math.min(...values),
      max = Math.max(...values);
    const pts = values
      .map((v, i) => (i / (values.length - 1)) * 100 + ',' + (24 - ((v - min) / (max - min || 1)) * 20))
      .join(' ');
    const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    attrs(svg, {class: 'st-spark', viewBox: '0 0 100 26', preserveAspectRatio: 'none', 'aria-hidden': 'true'});
    const line = doc.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    line.setAttribute('points', pts);
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.append(line);
    return svg;
  };
  function render() {
    grid.replaceChildren();
    DATA[period].forEach(([label, value, unit, delta, trend]) => {
      const better = LOWER_IS_BETTER.has(label) ? delta < 0 : delta > 0;
      const card = make('div', undefined, 'st-card');
      const from = shown[label] ?? value;
      const tween = from !== value && !isReducedMotion();
      const valueEl = make('span', fmt(tween ? from : value, unit), 'st-value');
      const sign = delta > 0 ? '▲ +' : '▼ ';
      const deltaEl = make('span', sign + Math.abs(delta) + '%', 'st-delta ' + (better ? 'up' : 'down'));
      deltaEl.setAttribute(
        'aria-label',
        (delta > 0 ? '增加 ' : '減少 ') + Math.abs(delta) + '%，' + (better ? '表現較好' : '表現較差'),
      );
      card.append(
        make('span', label, 'st-label'),
        valueEl,
        deltaEl,
        make('span', '與上' + period.slice(1) + '相比', 'st-label'),
        spark(trend),
      );
      card.setAttribute('role', 'group');
      card.setAttribute('aria-label', label);
      grid.append(card);
      shown[label] = value;
      if (tween) animate(500, p => (valueEl.textContent = fmt(from + (value - from) * (1 - (1 - p) ** 3), unit)));
    });
  }
  const select = i => {
    tabs.forEach((t, j) => {
      t.classList.toggle('active', i === j);
      attrs(t, {'aria-checked': i === j, tabindex: i === j ? 0 : -1});
    });
    period = tabs[i].textContent;
    render();
    say('顯示' + period + '數據');
  };
  choiceGroup(tabs, select);
  period = preset === 'selected' ? '本月' : '本週';
  DATA[period].forEach(([label, value]) => (shown[label] = value));
  tabs.forEach((t, j) => {
    const active = t.textContent === period;
    t.classList.toggle('active', active);
    attrs(t, {'aria-checked': active, tabindex: active ? 0 : -1});
  });
  render();
});
