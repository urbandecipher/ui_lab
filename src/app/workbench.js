(() => {
  const $ = id => document.getElementById(id),
    style = window.UILabStyle;
  function syncSettings() {
    const state = style.get();
    for (const name in state) $('style-' + name).value = state[name];
    $('style-status').textContent = style.persistent()
      ? '偏好會保存在這個瀏覽器。'
      : '目前無法保存偏好；本次開啟仍可使用設定。';
  }
  for (const name of ['theme', 'font', 'density', 'corners', 'motion'])
    $('style-' + name).addEventListener('change', event => style.set(name, event.target.value));
  document.addEventListener('uilab-style-change', syncSettings);
  $('style-reset').addEventListener('click', () => {
    style.reset();
    $('style-status').textContent = '已恢復預設樣式。' + (style.persistent() ? '' : '目前無法保存偏好。');
  });
  $('style-export').addEventListener('click', () => {
    const computed = getComputedStyle(document.documentElement),
      tokens = {};
    for (const name of [
      '--bg',
      '--panel',
      '--text',
      '--text-dim',
      '--accent',
      '--on-accent',
      '--radius',
      '--radius-s',
      '--pill',
      '--font-scale',
      '--space-card',
      '--space-grid',
      '--motion-fast',
      '--motion-normal',
    ])
      tokens[name] = computed.getPropertyValue(name).trim();
    const output = {
      version: '3.0',
      preferences: style.get(),
      resolvedTheme: document.documentElement.dataset.mode,
      tokens,
      css:
        ':root {\n' +
        Object.entries(tokens)
          .map(([key, value]) => '  ' + key + ': ' + value + ';')
          .join('\n') +
        '\n}',
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(output, null, 2)], {type: 'application/json'})),
      a = document.createElement('a');
    a.href = url;
    a.download = 'ui-lab-style-v3.json';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('style-status').textContent = '已匯出偏好與目前解析的樣式變數。';
  });
  // Round-one reload restoration runs before this script; saved preferences are authoritative.
  style.apply();
  syncSettings();
  const tabs = [...document.querySelectorAll('.scenario-tabs button')];
  function selectScene(index, focus = false) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', i === index);
      tab.tabIndex = i === index ? 0 : -1;
      $(tab.getAttribute('aria-controls')).hidden = i !== index;
    });
    if (focus) tabs[index].focus();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectScene(i));
    tab.addEventListener('keydown', event => {
      const key = event.key;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
      event.preventDefault();
      selectScene(key === 'Home' ? 0 : key === 'End' ? 2 : (i + (key === 'ArrowRight' ? 1 : 2)) % 3, true);
    });
  });
  function revealSection() {
    const hash = location.hash.slice(1);
    const index = ['scene-account', 'scene-inventory', 'scene-battle'].indexOf(hash);
    if (index >= 0) {
      selectScene(index);
      $(hash).scrollIntoView();
    }
    if (hash === 'version-history') $('version-history').open = true;
  }
  addEventListener('hashchange', revealSection);
  revealSection();
  // ACCOUNT: each async completion belongs to one run; resetting cancels stale work.
  let accountStage = 0,
    accountBusy = false,
    accountTimer = null;
  const accountMessage = (message, tone = '') => {
    $('account-message').textContent = message;
    $('account-message').dataset.tone = tone;
  };
  function renderAccount() {
    $('account-email').disabled = accountBusy || accountStage > 0;
    $('account-code-wrap').hidden = accountStage !== 1;
    $('account-code').disabled = accountBusy;
    $('account-failure').disabled = accountBusy || accountStage > 0;
    $('account-submit').disabled = accountBusy || accountStage === 2;
    $('account-submit').textContent = accountBusy
      ? accountStage === 0
        ? '傳送中…'
        : '驗證中…'
      : accountStage === 0
        ? '傳送驗證碼'
        : accountStage === 1
          ? '確認驗證'
          : '已完成驗證';
    $('account-back').hidden = accountStage === 0;
    $('account-back').disabled = accountBusy;
    $('account-form').setAttribute('aria-busy', accountBusy);
    [...$('account-steps').children].forEach((step, i) => {
      if (i === accountStage) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
  }
  function resetAccount() {
    clearTimeout(accountTimer);
    accountBusy = false;
    accountStage = 0;
    $('account-form').reset();
    $('account-email').removeAttribute('aria-invalid');
    $('account-code').removeAttribute('aria-invalid');
    accountMessage('使用任意有效格式的電子郵件開始；不會實際寄信。');
    renderAccount();
  }
  $('account-reset').addEventListener('click', () => {
    resetAccount();
    $('account-email').focus();
  });
  $('account-back').addEventListener('click', () => {
    accountStage = 0;
    $('account-code').value = '';
    $('account-code').removeAttribute('aria-invalid');
    accountMessage('可修改電子郵件並重新傳送。');
    renderAccount();
    $('account-email').focus();
  });
  $('account-form').addEventListener('submit', event => {
    event.preventDefault();
    if (accountBusy || accountStage === 2) return;
    if (accountStage === 0 && !$('account-email').validity.valid) {
      $('account-email').setAttribute('aria-invalid', 'true');
      accountMessage('請輸入有效的電子郵件地址。', 'error');
      $('account-email').focus();
      return;
    }
    if (accountStage === 1 && !/^\d{6}$/.test($('account-code').value)) {
      $('account-code').setAttribute('aria-invalid', 'true');
      accountMessage('請輸入 6 位數字驗證碼。', 'error');
      $('account-code').focus();
      return;
    }
    $('account-email').removeAttribute('aria-invalid');
    $('account-code').removeAttribute('aria-invalid');
    accountBusy = true;
    renderAccount();
    accountMessage(accountStage === 0 ? '正在模擬傳送…' : '正在驗證…');
    accountTimer = setTimeout(() => {
      accountBusy = false;
      if (accountStage === 0) {
        if ($('account-failure').checked) {
          $('account-failure').checked = false;
          accountMessage('傳送失敗，請重試。', 'error');
          renderAccount();
          $('account-submit').focus();
          return;
        }
        accountStage = 1;
        accountMessage('示範驗證碼已準備好：123456。');
        renderAccount();
        $('account-code').focus();
      } else if ($('account-code').value === '123456') {
        accountStage = 2;
        accountMessage('驗證成功，帳號流程已完成。', 'success');
        renderAccount();
        $('account-reset').focus();
      } else {
        $('account-code').setAttribute('aria-invalid', 'true');
        accountMessage('驗證碼錯誤，請使用示範碼 123456。', 'error');
        renderAccount();
        $('account-code').focus();
      }
    }, 650);
  });
  resetAccount();
  // INVENTORY: undo records the complete order so selection/reordering after deletion cannot corrupt it.
  const originalItems = [
    {id: 1, name: '旅人短劍'},
    {id: 2, name: '木製圓盾'},
    {id: 3, name: '治療藥水'},
    {id: 4, name: '傳送卷軸'},
  ];
  let items = [],
    selected = new Set(),
    undo = null,
    dragged = null,
    confirmDialog = null;
  function itemMessage(value) {
    $('inventory-message').textContent = value;
  }
  function renderItems() {
    const list = $('scenario-items');
    list.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('li');
      empty.textContent = '背包已空，可撤銷上次刪除或重設流程。';
      list.append(empty);
    }
    items.forEach((item, index) => {
      const row = document.createElement('li');
      row.draggable = true;
      row.dataset.item = item.id;
      const label = document.createElement('label'),
        checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = selected.has(item.id);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) selected.add(item.id);
        else selected.delete(item.id);
        $('inventory-delete').disabled = !selected.size;
      });
      label.append(checkbox, document.createTextNode(item.name));
      row.append(label);
      for (const [direction, symbol, name] of [
        [-1, '↑', '上移'],
        [1, '↓', '下移'],
      ]) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'catalog-button';
        b.textContent = symbol;
        b.setAttribute('aria-label', item.name + ' ' + name);
        b.disabled = direction < 0 ? index === 0 : index === items.length - 1;
        b.addEventListener('click', () => {
          const next = index + direction;
          [items[index], items[next]] = [items[next], items[index]];
          renderItems();
          const candidate =
            list.querySelector('[data-item="' + item.id + '"] button:not([disabled])') ||
            list.querySelector('[data-item="' + item.id + '"] input');
          candidate.focus();
          itemMessage('已調整 ' + item.name + ' 的順序。');
        });
        row.append(b);
      }
      row.addEventListener('dragstart', event => {
        dragged = item.id;
        event.dataTransfer.setData('text/plain', String(item.id));
      });
      row.addEventListener('dragend', () => (dragged = null));
      row.addEventListener('dragover', event => event.preventDefault());
      row.addEventListener('drop', event => {
        event.preventDefault();
        const from = items.findIndex(it => it.id === dragged),
          to = items.findIndex(it => it.id === item.id);
        if (from >= 0 && from !== to) {
          const [moving] = items.splice(from, 1);
          items.splice(to, 0, moving);
          renderItems();
          itemMessage('物品順序已更新。');
        }
        dragged = null;
      });
      list.append(row);
    });
    $('inventory-delete').disabled = !selected.size;
    $('inventory-undo').hidden = !undo;
  }
  function resetItems() {
    confirmDialog?.close();
    items = originalItems.map(item => ({...item}));
    selected = new Set();
    undo = null;
    renderItems();
    itemMessage('選取物品後可刪除；也可拖曳或使用上下按鈕排序。');
  }
  $('inventory-reset').addEventListener('click', resetItems);
  $('inventory-delete').addEventListener('click', () => {
    if (!selected.size) return;
    const dialog = document.createElement('dialog');
    confirmDialog = dialog;
    dialog.className = 'demo-dialog';
    dialog.setAttribute('aria-labelledby', 'inventory-confirm-title');
    dialog.innerHTML =
      '<h3 id="inventory-confirm-title">確認刪除物品</h3><p></p><div class="scenario-actions"><button class="catalog-button" type="button">取消</button><button class="btn btn-primary" type="button">確認刪除</button></div>';
    dialog.querySelector('p').textContent = '將刪除 ' + selected.size + ' 件物品，可使用「撤銷上次刪除」復原。';
    const [cancel, confirm] = dialog.querySelectorAll('button');
    cancel.addEventListener('click', () => dialog.close());
    confirm.addEventListener('click', () => {
      undo = items.map(item => ({...item}));
      const count = selected.size;
      items = items.filter(item => !selected.has(item.id));
      selected.clear();
      renderItems();
      itemMessage('已刪除 ' + count + ' 件物品。撤銷會回復刪除前的清單與順序。');
      dialog.close();
    });
    dialog.addEventListener('close', () => {
      dialog.remove();
      confirmDialog = null;
      ($('inventory-delete').disabled ? $('inventory-undo') : $('inventory-delete')).focus();
    });
    document.body.append(dialog);
    dialog.showModal();
    cancel.focus();
  });
  $('inventory-undo').addEventListener('click', () => {
    if (!undo) return;
    items = undo;
    undo = null;
    selected.clear();
    renderItems();
    itemMessage('已復原刪除前的物品與順序。');
    $('scenario-items').querySelector('input')?.focus();
  });
  resetItems();
  // BATTLE: action points and cooldown belong to one battle; a reset clears the cooldown timer.
  let battle = {player: 100, enemy: 100, ap: 3, round: 1, cooldown: 0},
    cooldownTimer = null;
  const ended = () => battle.player === 0 || battle.enemy === 0;
  function renderBattle() {
    for (const side of ['player', 'enemy']) {
      $('battle-' + side).value = battle[side];
      $('battle-' + side + '-value').textContent = battle[side] + ' / 100';
    }
    $('battle-ap').textContent = battle.ap + ' / 3';
    $('battle-round').textContent = battle.round;
    $('battle-attack').disabled = ended() || battle.ap < 1;
    $('battle-skill').disabled = ended() || battle.ap < 2 || battle.cooldown > 0;
    $('battle-next').disabled = ended();
    $('battle-skill').textContent = battle.cooldown ? '重擊冷卻 · ' + battle.cooldown + ' 秒' : '重擊 · 2 點';
  }
  function battleMessage(value) {
    $('battle-message').textContent = value;
    const line = document.createElement('li');
    line.textContent = value;
    $('battle-log').prepend(line);
    while ($('battle-log').children.length > 5) $('battle-log').lastElementChild.remove();
  }
  function attack(skill) {
    const cost = skill ? 2 : 1;
    if (ended() || battle.ap < cost || (skill && battle.cooldown)) return;
    battle.ap -= cost;
    battle.enemy = Math.max(0, battle.enemy - (skill ? 35 : 15));
    if (skill) {
      battle.cooldown = 3;
      clearInterval(cooldownTimer);
      cooldownTimer = setInterval(() => {
        battle.cooldown = Math.max(0, battle.cooldown - 1);
        renderBattle();
        if (!battle.cooldown) clearInterval(cooldownTimer);
      }, 1000);
    }
    battleMessage(
      battle.enemy === 0 ? '勝利！訓練守衛已被擊敗。' : (skill ? '重擊造成 35' : '普通攻擊造成 15') + ' 點傷害。',
    );
    renderBattle();
  }
  $('battle-attack').addEventListener('click', () => attack(false));
  $('battle-skill').addEventListener('click', () => attack(true));
  $('battle-next').addEventListener('click', () => {
    if (ended()) return;
    battle.player = Math.max(0, battle.player - 20);
    battle.round++;
    battle.ap = 3;
    battleMessage(battle.player === 0 ? '戰鬥失敗，請重新戰鬥。' : '守衛反擊 20 點傷害，行動點恢復至 3。');
    renderBattle();
  });
  function resetBattle() {
    clearInterval(cooldownTimer);
    battle = {player: 100, enemy: 100, ap: 3, round: 1, cooldown: 0};
    $('battle-log').replaceChildren();
    battleMessage('戰鬥開始。普通攻擊消耗 1 點，重擊消耗 2 點。');
    renderBattle();
  }
  $('battle-reset').addEventListener('click', resetBattle);
  resetBattle();
})();
