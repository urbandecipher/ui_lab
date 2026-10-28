// Preference values are allowlisted; blocked local storage falls back to this session.
(() => {
  const root = document.documentElement,
    key = 'ui-lab-style-v3';
  const choices = {
    theme: ['system', 'light', 'dark'],
    font: ['small', 'standard', 'large'],
    density: ['comfortable', 'compact'],
    corners: ['soft', 'square', 'round'],
    motion: ['system', 'reduced', 'full', 'off'],
  };
  const defaults = {theme: 'system', font: 'standard', density: 'comfortable', corners: 'soft', motion: 'system'};
  const color = matchMedia('(prefers-color-scheme: dark)'),
    motion = matchMedia('(prefers-reduced-motion: reduce)');
  let state = {...defaults},
    persistent = true;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved) for (const name in choices) if (choices[name].includes(saved[name])) state[name] = saved[name];
  } catch {
    persistent = false;
  }
  function apply() {
    root.dataset.mode = state.theme === 'system' ? (color.matches ? 'dark' : 'light') : state.theme;
    root.dataset.font = state.font;
    root.dataset.density = state.density;
    root.dataset.corners = state.corners;
    root.dataset.motion = state.motion === 'system' ? (motion.matches ? 'reduced' : 'full') : state.motion;
    root.style.setProperty('--font-scale', {small: '.92', standard: '1', large: '1.14'}[state.font]);
    document.dispatchEvent(new CustomEvent('uilab-style-change', {detail: {...state}}));
  }
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(state));
      persistent = true;
    } catch {
      persistent = false;
    }
  }
  window.UILabStyle = {
    get: () => ({...state}),
    persistent: () => persistent,
    set(name, value) {
      if (!choices[name]?.includes(value)) return;
      state[name] = value;
      save();
      apply();
    },
    reset() {
      state = {...defaults};
      save();
      apply();
    },
    toggle() {
      this.set('theme', root.dataset.mode === 'dark' ? 'light' : 'dark');
    },
    attributes() {
      return ['mode', 'font', 'density', 'corners', 'motion']
        .map(name => 'data-' + name + '="' + root.dataset[name] + '"')
        .join(' ');
    },
    css() {
      return ':root{--font-scale:' + root.style.getPropertyValue('--font-scale') + ';}';
    },
    apply,
  };
  color.addEventListener('change', () => {
    if (state.theme === 'system') apply();
  });
  motion.addEventListener('change', () => {
    if (state.motion === 'system') apply();
  });
  apply();
})();
