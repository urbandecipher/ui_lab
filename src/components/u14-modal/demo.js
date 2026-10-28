// U14 彈出視窗 — Modal Dialog，確認類互動
UILab.define(14, ({preset, q, on, later, make, say, control, openDialog}) => {
  const launch = q('button');
  const open = () => {
    const content = make('div');
    content.append(make('p', '這是一個確認操作示範。'));
    const actions = make('div', undefined, 'modal-actions');
    content.append(actions);
    let popup;
    control('取消', () => popup.dismiss(), actions);
    control(
      '確認',
      () => {
        popup.dismiss();
        say('操作已確認');
      },
      actions,
    );
    popup = openDialog('確認操作', content, actions.firstElementChild);
  };
  on(launch, 'click', open);
  if (preset === 'expanded') later(open, 0);
});
