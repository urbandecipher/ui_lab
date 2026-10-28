// UI LAB 核心執行環境：每個元件以 UILab.define(編號, setup) 註冊，mountDemo(容器, 編號, 狀態) 掛載。
// 同一頁可掛載多個相同元件：容器內的 id、label[for]、aria 參照與 radio 名稱都會依實例加上前綴。
(function (global) {
  'use strict';
  const registry = new Map();
  let instanceCount = 0;
  const ID_REFS = [
    'for',
    'aria-controls',
    'aria-labelledby',
    'aria-describedby',
    'aria-owns',
    'aria-activedescendant',
    'aria-errormessage',
    'list',
    'form',
  ];

  function define(number, setup) {
    registry.set(Number(number), setup);
  }

  // Gives every id inside one mounted instance a unique prefix and keeps references pointing at it.
  function scopeIds(root) {
    const ns = 'ui' + ++instanceCount;
    const map = new Map();
    root.querySelectorAll('[id]').forEach(el => {
      const next = ns + '-' + el.id;
      map.set(el.id, next);
      el.id = next;
    });
    root.querySelectorAll('*').forEach(el => {
      for (const name of ID_REFS) {
        const value = el.getAttribute(name);
        if (value)
          el.setAttribute(
            name,
            value
              .split(/\s+/)
              .map(token => map.get(token) || token)
              .join(' '),
          );
      }
    });
    root.querySelectorAll('input[type="radio"][name]').forEach(el => {
      el.name = ns + '-' + el.name;
    });
    const scope = selector =>
      selector.replace(/#([A-Za-z_][\w-]*)/g, (match, id) => (map.has(id) ? '#' + map.get(id) : match));
    const uid = name => ns + '-' + name;
    return {scope, uid};
  }

  function mountDemo(root, number, preset = 'default') {
    const doc = root.ownerDocument,
      win = doc.defaultView;
    const {scope, uid} = scopeIds(root);
    const q = selector => root.querySelector(scope(selector)),
      all = selector => [...root.querySelectorAll(scope(selector))];
    const abort = new AbortController(),
      timers = new Set(),
      frames = new Set(),
      portals = new Set();
    const on = (el, event, fn, options = {}) => el?.addEventListener(event, fn, {...options, signal: abort.signal});
    const later = (fn, ms) => {
      const id = win.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    };
    const frame = fn => {
      const id = win.requestAnimationFrame(t => {
        frames.delete(id);
        fn(t);
      });
      frames.add(id);
      return id;
    };
    const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
    const isReducedMotion = () => ['reduced', 'off'].includes(doc.documentElement.dataset.motion) || motion.matches;
    const text = (selector, value) => {
      if (q(selector)) q(selector).textContent = value;
    };
    const attrs = (el, values) => {
      for (const [key, value] of Object.entries(values)) el.setAttribute(key, String(value));
    };
    const button = (el, name, handler) => {
      if (!el) return;
      if (el.tagName !== 'BUTTON') {
        attrs(el, {role: 'button', tabindex: 0});
        on(el, 'keydown', e => {
          if (e.target === el && ['Enter', ' '].includes(e.key)) {
            e.preventDefault();
            el.click();
          }
        });
      }
      if (name) el.setAttribute('aria-label', name);
      on(el, 'click', handler);
    };
    const make = (tag, content, className) => {
      const el = doc.createElement(tag);
      if (content !== undefined) el.textContent = content;
      if (className) el.className = className;
      return el;
    };
    const body = q('.module-body');
    const live = make('p', '', 'demo-live');
    attrs(live, {role: 'status', 'aria-live': 'polite', 'aria-atomic': true});
    root.append(live);
    const say = value => {
      live.textContent = value;
    };
    const control = (label, fn, parent = body) => {
      const el = make('button', label, 'catalog-button');
      el.type = 'button';
      on(el, 'click', fn);
      parent.append(el);
      return el;
    };
    all('*').forEach(el =>
      [...el.attributes].filter(a => a.name.startsWith('on')).forEach(a => el.removeAttribute(a.name)),
    );
    all('button').forEach(el => (el.type = 'button'));
    let dialogCount = 0;
    const openDialog = (title, content, first) => {
      const previous = doc.activeElement,
        dialog = make('dialog', undefined, 'demo-dialog');
      const heading = make('h3', title);
      heading.id = uid('dialog-' + ++dialogCount);
      dialog.setAttribute('aria-labelledby', heading.id);
      const close = make('button', '關閉', 'catalog-button');
      close.type = 'button';
      dialog.append(heading, content, close);
      doc.body.append(dialog);
      portals.add(dialog);
      const dismiss = () => dialog.close();
      on(close, 'click', dismiss);
      on(dialog, 'click', e => {
        if (e.target === dialog) {
          const r = dialog.getBoundingClientRect();
          if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dismiss();
        }
      });
      on(dialog, 'close', () => {
        dialog.remove();
        portals.delete(dialog);
        if (previous?.isConnected) previous.focus({preventScroll: true});
      });
      dialog.showModal();
      (first || close).focus();
      return {dialog, dismiss};
    };
    const animate = (duration, update, done = () => {}) => {
      const start = win.performance.now();
      function tick(now) {
        const p = Math.min(1, (now - start) / duration);
        update(p);
        if (p < 1) frame(tick);
        else done();
      }
      frame(tick);
    };
    function choiceGroup(items, select, role = 'radio') {
      const parent = items[0]?.parentElement;
      if (!parent) return;
      parent.setAttribute('role', role === 'tab' ? 'tablist' : 'radiogroup');
      items.forEach((el, i) => {
        attrs(el, {role, tabindex: i === 0 ? 0 : -1});
        button(el, null, () => select(i));
        el.setAttribute('role', role);
        on(el, 'keydown', e => {
          let next = i;
          if (['ArrowRight', 'ArrowDown'].includes(e.key)) next = (i + 1) % items.length;
          else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) next = (i - 1 + items.length) % items.length;
          else if (e.key === 'Home') next = 0;
          else if (e.key === 'End') next = items.length - 1;
          else return;
          e.preventDefault();
          select(next);
          items[next].focus();
        });
      });
    }
    const setup = registry.get(Number(number));
    if (!setup) throw new Error('UI LAB：找不到 U' + number + ' 的初始化程式，請先載入該元件的 demo.js');
    setup({
      root,
      number,
      preset,
      scope,
      uid,
      doc,
      win,
      q,
      all,
      abort,
      timers,
      frames,
      portals,
      on,
      later,
      frame,
      motion,
      isReducedMotion,
      text,
      attrs,
      button,
      make,
      body,
      live,
      say,
      control,
      openDialog,
      animate,
      choiceGroup,
    });
    if (preset === 'disabled') {
      timers.forEach(id => win.clearTimeout(id));
      frames.forEach(id => win.cancelAnimationFrame(id));
      body.inert = true;
      body.classList.add('demo-disabled');
      body.setAttribute('aria-disabled', 'true');
      say('已停用：此狀態不可操作。');
    }
    root.dataset.ready = String(number);
    root.dataset.preset = preset;
    return () => {
      abort.abort();
      timers.forEach(id => win.clearTimeout(id));
      frames.forEach(id => win.cancelAnimationFrame(id));
      portals.forEach(el => el.remove());
    };
  }

  global.UILab = {define, mount: mountDemo, version: '5.2'};
  global.mountDemo = mountDemo;
})(window);
