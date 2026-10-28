// U42 戰利品開箱 — Loot Reveal，稀有度分級光暈與掃光效果
UILab.define(42, ({preset, q, later, text, button, say}) => {
  let busy = false;
  const box = q('#lootBox');
  button(box, '開啟戰利品', () => {
    if (busy) return;
    busy = true;
    box.setAttribute('aria-disabled', 'true');
    box.classList.add('shake');
    later(() => {
      box.classList.remove('shake');
      const tier = ['普通', '稀有', '史詩', '傳說'][Math.floor(Math.random() * 4)];
      text('#lootResult', '獲得【' + tier + '】物品');
      say('獲得' + tier + '物品');
      busy = false;
      box.setAttribute('aria-disabled', 'false');
    }, 350);
  });
  if (preset === 'success') text('#lootResult', '獲得【傳說】物品');
});
