// U68 色彩選擇 — Color Picker，預設色票、色碼輸入與對比檢查
UILab.define(68, ({preset, uid, q, on, attrs, make, say, choiceGroup}) => {
  const PRESETS = [
    ['#DE5A4E', '珊瑚紅'],
    ['#DB9A2E', '琥珀黃'],
    ['#2E9E68', '森林綠'],
    ['#0E93A3', '湖水青'],
    ['#4A87E8', '天空藍'],
    ['#8A6BE8', '薰衣草紫'],
    ['#E05590', '桃紅'],
    ['#1B1B18', '墨黑'],
  ];
  const box = q('.cp-swatches'),
    hex = q('.cp-hex'),
    native = q('.cp-native'),
    chip = q('.cp-chip'),
    contrast = q('.cp-contrast');
  let color = PRESETS[4][0];
  box.setAttribute('aria-label', '預設色票');
  contrast.id = uid('cp-contrast');
  attrs(hex, {'aria-describedby': contrast.id});
  attrs(native, {'aria-label': '自訂顏色'});

  // WCAG relative luminance and contrast ratio.
  const lum = h => {
    const [r, g, b] = [1, 3, 5]
      .map(i => parseInt(h.slice(i, i + 2), 16) / 255)
      .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  const normalize = v => {
    let s = v.trim().replace(/^#?/, '#').toUpperCase();
    if (/^#[0-9A-F]{3}$/.test(s)) s = '#' + [...s.slice(1)].map(c => c + c).join('');
    return /^#[0-9A-F]{6}$/.test(s) ? s : null;
  };
  const swatches = PRESETS.map(([value, name]) => {
    const b = make('button', undefined, 'cp-swatch');
    b.type = 'button';
    b.style.background = value;
    attrs(b, {'aria-label': name + ' ' + value, 'data-value': value});
    box.append(b);
    return b;
  });

  function render({fromInput = false} = {}) {
    swatches.forEach(b => {
      const checked = b.dataset.value === color;
      b.setAttribute('aria-checked', checked);
      b.tabIndex = checked || (!PRESETS.some(p => p[0] === color) && b === swatches[0]) ? 0 : -1;
    });
    if (!fromInput) hex.value = color;
    hex.removeAttribute('aria-invalid');
    native.value = color.toLowerCase();
    const white = ratio(color, '#FFFFFF'),
      black = ratio(color, '#1B1B18');
    const useWhite = white >= black,
      best = Math.max(white, black);
    chip.style.background = color;
    chip.style.color = useWhite ? '#FFFFFF' : '#1B1B18';
    contrast.textContent =
      (useWhite ? '白字' : '黑字') +
      '對比 ' +
      best.toFixed(1) +
      ':1 · ' +
      (best >= 4.5 ? '符合 AA' : best >= 3 ? '僅適合大字（AA 大字）' : '對比不足');
    contrast.classList.toggle('fail', best < 4.5);
  }
  const select = i => {
    color = PRESETS[i][0];
    render();
    say('已選擇 ' + PRESETS[i][1]);
  };
  choiceGroup(swatches, select);
  on(hex, 'input', () => {
    const v = normalize(hex.value);
    if (v) {
      color = v;
      render({fromInput: true});
    }
  });
  on(hex, 'blur', () => {
    const v = normalize(hex.value);
    if (!v) {
      hex.setAttribute('aria-invalid', 'true');
      contrast.textContent = '色碼格式為 #RRGGBB，例如 #4A87E8';
      contrast.classList.add('fail');
    } else {
      color = v;
      render();
    }
  });
  on(native, 'input', () => {
    color = native.value.toUpperCase();
    render();
  });
  if (preset === 'selected') color = '#E05590';
  render();
  if (preset === 'error') {
    hex.value = '#12';
    hex.setAttribute('aria-invalid', 'true');
    contrast.textContent = '色碼格式為 #RRGGBB，例如 #4A87E8';
    contrast.classList.add('fail');
  }
});
