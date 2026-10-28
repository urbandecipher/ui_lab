// U31 對話選項 — Dialogue Choice，打字機效果 + 分支選項
UILab.define(31, ({preset, q, later, isReducedMotion, text, body, say, control}) => {
  const line = '旅人，前方的路已被封鎖，你打算怎麼做？',
    choices = q('#dialogueChoices');
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    text('#dialogueText', line);
    ['出示證件', '嘗試說服', '強行通過'].forEach(label => {
      const b = control(
        '▸ ' + label,
        () => {
          text('#dialogueText', '你選擇了「' + label + '」。');
          choices.replaceChildren();
          say('已選擇 ' + label);
        },
        choices,
      );
      b.classList.add('show');
    });
  };
  q('#dialogueText').setAttribute('aria-label', line);
  if (isReducedMotion() || preset === 'complete') finish();
  else {
    let i = 0;
    const tick = () => {
      if (finished) return;
      text('#dialogueText', line.slice(0, ++i));
      if (i < line.length) later(tick, 35);
      else finish();
    };
    tick();
    control('略過打字動畫', finish, body);
  }
});
