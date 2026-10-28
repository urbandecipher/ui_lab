// U60 樹狀清單 — Tree View，多層階層的展開與選取
UILab.define(60, ({preset, q, on, attrs, make, say}) => {
  const tree = q('.tree'),
    data = [
      {
        name: 'src',
        children: [
          {name: 'components', children: [{name: 'Button.tsx'}, {name: 'Modal.tsx'}]},
          {name: 'styles', children: [{name: 'tokens.css'}]},
          {name: 'index.ts'},
        ],
      },
      {name: 'docs', children: [{name: 'guide.md'}]},
      {name: 'README.md'},
    ];
  const open = new Set(preset === 'expanded' ? ['src', 'src/components', 'src/styles', 'docs'] : ['src']);
  let selected = preset === 'selected' ? 'src/components/Button.tsx' : null,
    focusId = selected;
  if (preset === 'selected') open.add('src/components');
  const build = (nodes, parent, level, prefix) =>
    nodes.forEach(n => {
      const id = prefix + n.name,
        li = make('li'),
        row = make('span', undefined, 'tree-row'),
        caret = make('span', n.children ? (open.has(id) ? '▾' : '▸') : '', 'tree-caret'),
        icon = make('span', n.children ? '📁' : '📄');
      attrs(li, {role: 'treeitem', 'aria-level': level, 'aria-selected': id === selected});
      li.dataset.id = id;
      caret.setAttribute('aria-hidden', 'true');
      icon.setAttribute('aria-hidden', 'true');
      row.style.paddingLeft = (level - 1) * 16 + 6 + 'px';
      row.append(caret, icon, make('span', n.name));
      li.append(row);
      if (n.children) {
        li.setAttribute('aria-expanded', open.has(id));
        if (open.has(id)) {
          const ul = make('ul');
          ul.setAttribute('role', 'group');
          build(n.children, ul, level + 1, id + '/');
          li.append(ul);
        }
      }
      parent.append(li);
    });
  const items = () => [...tree.querySelectorAll('[role="treeitem"]')];
  const render = focus => {
    tree.replaceChildren();
    build(data, tree, 1, '');
    const list = items();
    if (!list.some(li => li.dataset.id === focusId)) focusId = list[0].dataset.id;
    list.forEach(li => (li.tabIndex = li.dataset.id === focusId ? 0 : -1));
    if (focus) list.find(li => li.dataset.id === focusId).focus();
  };
  const activate = li => {
    if (li.hasAttribute('aria-expanded')) {
      open.has(li.dataset.id) ? open.delete(li.dataset.id) : open.add(li.dataset.id);
    } else {
      selected = li.dataset.id;
      say('已開啟 ' + selected);
    }
  };
  on(tree, 'click', e => {
    const li = e.target.closest('[role="treeitem"]');
    if (!li) return;
    focusId = li.dataset.id;
    activate(li);
    render(true);
  });
  on(tree, 'keydown', e => {
    const list = items(),
      i = list.findIndex(li => li.dataset.id === focusId),
      li = list[i];
    if (!li) return;
    const folder = li.hasAttribute('aria-expanded'),
      id = focusId;
    if (e.key === 'ArrowDown') focusId = list[Math.min(i + 1, list.length - 1)].dataset.id;
    else if (e.key === 'ArrowUp') focusId = list[Math.max(i - 1, 0)].dataset.id;
    else if (e.key === 'Home') focusId = list[0].dataset.id;
    else if (e.key === 'End') focusId = list[list.length - 1].dataset.id;
    else if (e.key === 'ArrowRight') {
      if (folder && !open.has(id)) open.add(id);
      else if (folder) focusId = list[i + 1]?.dataset.id || id;
    } else if (e.key === 'ArrowLeft') {
      if (folder && open.has(id)) open.delete(id);
      else {
        const parent = li.parentElement.closest('[role="treeitem"]');
        if (parent) focusId = parent.dataset.id;
      }
    } else if (e.key === 'Enter' || e.key === ' ') activate(li);
    else return;
    e.preventDefault();
    render(true);
  });
  render(false);
});
