// U27 技能冷卻按鈕 — Skill Cooldown，圓形進度遮罩表示冷卻中
UILab.define(27, ({preset, q, text, button, say, animate}) => {
  const slot = q('#skillSlot');
  let busy = false;
  const trigger = () => {
    if (busy) return;
    busy = true;
    slot.setAttribute('aria-disabled', 'true');
    animate(
      4000,
      p => {
        q('#skillMask').style.setProperty('--pct', p * 100 + '%');
        text('#skillTimer', p < 1 ? Math.ceil(4 * (1 - p)) : '');
      },
      () => {
        busy = false;
        slot.setAttribute('aria-disabled', 'false');
        say('技能已就緒');
      },
    );
  };
  button(slot, '施放技能', trigger);
  slot.setAttribute('aria-disabled', 'false');
  if (preset === 'cooldown') trigger();
});
