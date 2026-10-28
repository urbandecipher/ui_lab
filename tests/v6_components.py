"""U67–U90 互動測試。用法：python tests/v6_components.py dist/ui-lab-minimal.html"""
import sys, asyncio, pathlib
from playwright.async_api import async_playwright

PAGE = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'dist/ui-lab-minimal.html').resolve().as_uri()
results = []


def check(name, cond, detail=''):
    results.append(bool(cond))
    print(('✓ ' if cond else '✗ ') + name + ('' if cond else '  → ' + str(detail)))


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1280, 'height': 900})
        await ctx.grant_permissions(['clipboard-read', 'clipboard-write'])
        pg = await ctx.new_page()
        errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        await pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        await pg.goto(PAGE)
        await pg.wait_for_timeout(400)
        await pg.evaluate("UILabStyle.set('motion','off')")
        T = lambda s: pg.text_content(s)
        A = lambda s, a: pg.get_attribute(s, a)
        active = lambda js='document.activeElement': pg.evaluate(js)

        # U67 日期區間
        c = '#u67-date-range '
        await pg.click(c + '.dr-day >> nth=9')
        await pg.click(c + '.dr-day >> nth=13')
        check('U67 兩次點選得到 5 天區間', '（5 天）' in await T(c + '.dr-summary'), await T(c + '.dr-summary'))
        await pg.click(c + '[data-preset="7"]')
        check('U67 近 7 天', '（7 天）' in await T(c + '.dr-summary'))
        await pg.click(c + '.dr-day >> nth=2')
        await pg.keyboard.press('ArrowRight')
        await pg.keyboard.press('Escape')
        check('U67 Esc 取消未完成的區間', await T(c + '.dr-summary') == '請選擇開始日期', await T(c + '.dr-summary'))

        # U68 色彩選擇
        c = '#u68-color-picker '
        await pg.focus(c + '.cp-swatch[tabindex="0"]')
        await pg.keyboard.press('ArrowRight')
        check('U68 方向鍵切換色票', await A(c + '.cp-swatch >> nth=5', 'aria-checked') == 'true')
        await pg.fill(c + '.cp-hex', '#fff')
        check('U68 色碼 #fff 套用並建議黑字', '黑字' in await T(c + '.cp-contrast'), await T(c + '.cp-contrast'))
        await pg.fill(c + '.cp-hex', '#12')
        await pg.focus(c + '.cp-native')
        check('U68 無效色碼離開時標示錯誤', await A(c + '.cp-hex', 'aria-invalid') == 'true')

        # U69 搜尋框
        c = '#u69-search-field '
        await pg.fill(c + '.sf-input', '設計')
        check('U69 有文字才顯示清除鈕', await pg.is_visible(c + '.sf-clear'))
        await pg.press(c + '.sf-input', 'Enter')
        check('U69 Enter 搜尋並加入紀錄', '找到' in await T(c + '.sf-result') and (await pg.locator(c + '.sf-recent-list li').first.inner_text()).startswith('設計'))
        await pg.press(c + '.sf-input', 'Escape')
        check('U69 Esc 清空', await pg.input_value(c + '.sf-input') == '' and await pg.is_hidden(c + '.sf-clear'))

        # U70 表單錯誤摘要
        c = '#u70-error-summary '
        await pg.click(c + '.es-submit')
        focused = await active("document.activeElement.classList.contains('es-summary')")
        check('U70 送出失敗：摘要取得焦點並列出 3 項', focused and await pg.locator(c + '.es-list a').count() == 3)
        await pg.click(c + '.es-list a >> nth=1')
        check('U70 錯誤連結跳到欄位', await active("document.activeElement.type") == 'email')
        await pg.fill(c + '[data-field=name] input', '林小安')
        await pg.fill(c + '[data-field=email] input', 'an@example.com')
        await pg.check(c + '[data-field=terms] input')
        await pg.click(c + '.es-submit')
        check('U70 修正後送出成功', await pg.is_visible(c + '.es-done') and await pg.is_hidden(c + '.es-summary'))

        # U71 選單按鈕
        c = '#u71-menu-button '
        await pg.click(c + '.mb-trigger')
        check('U71 開啟並聚焦第一項', await active("document.activeElement.textContent") == '重新命名')
        await pg.keyboard.press('ArrowUp')
        check('U71 ↑ 循環到最後一項', await active("document.activeElement.textContent") == '刪除')
        await pg.keyboard.press('Home')
        # Playwright types CJK via insertText (no keydown), so dispatch the type-ahead key directly.
        await pg.evaluate("document.activeElement.dispatchEvent(new KeyboardEvent('keydown', {key: '顯', bubbles: true}))")
        await pg.keyboard.press('Enter')
        check('U71 字元跳轉＋勾選項切換且不關閉', await A(c + '[role=menuitemcheckbox]', 'aria-checked') == 'true' and await pg.is_visible(c + '.mb-menu'))
        await pg.keyboard.press('Escape')
        check('U71 Esc 關閉並回到按鈕', await pg.is_hidden(c + '.mb-menu') and await active("document.activeElement.classList.contains('mb-trigger')"))

        # U72 可收合側欄
        c = '#u72-sidebar '
        await pg.click(c + '.sb-collapse')
        check('U72 收合後連結改用 aria-label', 'collapsed' in await A(c + '.sb', 'class') and await A(c + 'a.sb-link >> nth=0', 'aria-label') == '總覽')
        await pg.click(c + '.sb-toggle')
        check('U72 收合時點群組會展開側欄與子選單', 'collapsed' not in await A(c + '.sb', 'class') and await A(c + '.sb-toggle', 'aria-expanded') == 'true')

        # U73 目錄捲動追蹤
        c = '#u73-scrollspy '
        await pg.click(c + '.ss-toc a >> nth=2')
        await pg.wait_for_timeout(300)
        check('U73 點目錄：標示目前段落並聚焦標題', await A(c + '.ss-toc a >> nth=2', 'aria-current') == 'location' and await active("document.activeElement.tagName") == 'H4')
        await pg.evaluate("(b=>b.scrollTop=b.scrollHeight)(document.querySelector('#u73-scrollspy .ss-body'))")
        await pg.wait_for_timeout(300)
        check('U73 捲到底標示最後一段', await A(c + '.ss-toc a >> nth=3', 'aria-current') == 'location')

        # U74 底部分頁列
        c = '#u74-bottom-tabs '
        await pg.click(c + '.bt-item >> nth=2')
        check('U74 切換頁面並清除未讀', await A(c + '.bt-item >> nth=2', 'aria-current') == 'page' and await pg.locator(c + '.bt-badge').count() == 0)

        # U75 跳至主內容
        c = '#u75-skip-link '
        await pg.focus(c + '.sk-page')
        await pg.keyboard.press('Tab')
        check('U75 Tab 第一個是跳過連結', await active("document.activeElement.classList.contains('sk-link')"))
        await pg.keyboard.press('Enter')
        check('U75 Enter 焦點移到主內容', await active("document.activeElement.classList.contains('sk-main')"))

        # U76 兩段式確認
        c = '#u76-confirm-button '
        await pg.click(c + '.cb-btn')
        check('U76 第一次進入確認狀態', '再按一次' in await T(c + '.cb-text'))
        await pg.keyboard.press('Escape')
        check('U76 Esc 取消', await T(c + '.cb-text') == '刪除專案')
        await pg.click(c + '.cb-btn')
        await pg.click(c + '.cb-btn')
        check('U76 再按一次執行', '已刪除' in await T(c + '.cb-text') and await pg.is_disabled(c + '.cb-btn'))

        # U77 連線狀態
        c = '#u77-connection-banner '
        await pg.click(c + '.cn-toggle')
        await pg.click(c + '.cn-edit')
        check('U77 離線橫幅與待同步數', '離線' in await T(c + '.cn-text') and '1 項變更待同步' in await T(c + '.cn-line'))
        await pg.click(c + '.cn-toggle')
        await pg.wait_for_timeout(1400)
        check('U77 恢復後回報同步', '已同步 1 項變更' in await T(c + '.cn-text'), await T(c + '.cn-text'))

        # U78 自動儲存
        c = '#u78-autosave '
        await pg.click(c + '.as-input')
        await pg.keyboard.type('，補充事項')
        check('U78 輸入中顯示編輯中', await T(c + '.as-text') == '編輯中…')
        await pg.wait_for_timeout(1700)
        check('U78 停止輸入後已儲存', '已儲存' in await T(c + '.as-text'), await T(c + '.as-text'))
        await pg.check(c + '.as-fail')
        await pg.click(c + '.as-input')
        await pg.keyboard.type('！')
        await pg.wait_for_timeout(1700)
        check('U78 失敗顯示重試', '儲存失敗' in await T(c + '.as-text') and await pg.is_visible(c + '.as-retry'))

        # U79 時間軸
        c = '#u79-timeline '
        before = await pg.locator(c + '.tl-item').count()
        await pg.click(c + '.tl-more')
        check('U79 展開較早紀錄', before == 3 and await pg.locator(c + '.tl-item').count() == 6 and await A(c + '.tl-more', 'aria-expanded') == 'true')

        # U80 統計數字卡
        c = '#u80-stat-card '
        await pg.focus(c + '.st-tab >> nth=0')
        await pg.keyboard.press('ArrowRight')
        await pg.wait_for_timeout(700)
        check('U80 切換本月', await A(c + '.st-tab >> nth=1', 'aria-checked') == 'true' and 'NT$ 512,900' in await T(c + '.st-value >> nth=0'), await T(c + '.st-value >> nth=0'))
        check('U80 退貨率上升顯示為表現較差', 'down' in await A(c + '.st-delta >> nth=2', 'class'))

        # U81 描述清單
        c = '#u81-description-list '
        await pg.click(c + '[data-reveal]')
        check('U81 顯示完整電話', await T(c + '.dl-masked') == '0912-345-678' and await A(c + '[data-reveal]', 'aria-pressed') == 'true')

        # U82 圖片燈箱
        c = '#u82-lightbox '
        await pg.click(c + '.lb-thumb >> nth=1')
        check('U82 開啟燈箱', await pg.is_visible('dialog.lb-dialog') and await T('dialog.lb-dialog .lb-count') == '2 / 6')
        await pg.keyboard.press('ArrowRight')
        check('U82 → 下一張', await T('dialog.lb-dialog .lb-count') == '3 / 6')
        await pg.keyboard.press('Escape')
        await pg.wait_for_timeout(100)
        check('U82 關閉後回到目前這張縮圖', await pg.locator('dialog.lb-dialog').count() == 0 and await active("document.activeElement.textContent") == '城市夜景')

        # U83 分割面板
        c = '#u83-split-pane '
        await pg.focus(c + '.sp-handle')
        await pg.keyboard.press('ArrowRight')
        await pg.keyboard.press('ArrowRight')
        check('U83 方向鍵調整寬度', await A(c + '.sp-handle', 'aria-valuenow') == '50')
        await pg.keyboard.press('Enter')
        collapsed = await A(c + '.sp-handle', 'aria-valuenow') == '0' and await pg.is_hidden(c + '.sp-a')
        await pg.keyboard.press('Enter')
        check('U83 Enter 收合與還原', collapsed and await A(c + '.sp-handle', 'aria-valuenow') == '50')

        # U84 跨欄看板
        c = '#u84-kanban '
        await pg.focus(c + '[data-title="撰寫需求文件"]')
        await pg.keyboard.press('Space')
        await pg.keyboard.press('ArrowRight')
        await pg.keyboard.press('Space')
        col = await pg.evaluate("document.querySelector('#u84-kanban [data-title=\"撰寫需求文件\"]').closest('.kb-col').getAttribute('aria-label')")
        check('U84 鍵盤拿起→右移→放下', col.startswith('進行中'), col)
        await pg.keyboard.press('Space')
        await pg.keyboard.press('ArrowRight')
        await pg.keyboard.press('Escape')
        col = await pg.evaluate("document.querySelector('#u84-kanban [data-title=\"撰寫需求文件\"]').closest('.kb-col').getAttribute('aria-label')")
        check('U84 Esc 還原', col.startswith('進行中'), col)
        await pg.click(c + '[data-title="建立專案"] .kb-moves button >> nth=0')
        col = await pg.evaluate("document.querySelector('#u84-kanban [data-title=\"建立專案\"]').closest('.kb-col').getAttribute('aria-label')")
        check('U84 ◀ 按鈕移欄', col.startswith('進行中'), col)

        # U85 按鍵重新綁定
        c = '#u85-key-rebind '
        await pg.click(c + '[data-action="攻擊"]')
        check('U85 進入等待輸入', 'listening' in await A(c + '[data-action="攻擊"]', 'class'))
        await pg.keyboard.press('e')
        notice = await T(c + '.kr-notice')
        check('U85 衝突時對調並說明', await T(c + '[data-action="攻擊"]') == 'E' and await T(c + '[data-action="互動"]') == 'J' and '互動' in notice, notice)
        await pg.click(c + '[data-action="跳躍"]')
        await pg.keyboard.press('Escape')
        check('U85 Esc 取消保留原鍵', await T(c + '[data-action="跳躍"]') == '空白鍵')

        # U86 手把按鍵圖示
        c = '#u86-input-glyphs '
        await pg.focus(c + '.ig-devices button[tabindex="0"]')
        await pg.keyboard.press('ArrowRight')
        await pg.keyboard.press('ArrowRight')
        await pg.keyboard.press('ArrowRight')
        check('U86 切到 PlayStation 圖示並有讀法', '✕' in await T(c + '.ig-bar') and '叉叉鍵' in await T(c + '.ig-bar'))

        # U87 存檔欄位
        c = '#u87-save-slots '
        await pg.focus(c + '.sv-list')
        await pg.keyboard.press('ArrowDown')
        await pg.keyboard.press('Delete')
        armed = '再按一次' in await T(c + '.sv-delete')
        await pg.keyboard.press('Delete')
        check('U87 Delete 兩次刪除欄位，載入停用', armed and '空白' in await T(c + '.sv-slot >> nth=1') and await pg.is_disabled(c + '.sv-load'))
        await pg.click(c + '.sv-save')
        check('U87 空欄直接儲存', '第四章' in await T(c + '.sv-slot >> nth=1'))

        # U88 任務追蹤
        c = '#u88-quest-tracker '
        for _ in range(7):
            if await pg.is_enabled(c + '.qt-progress'):
                await pg.click(c + '.qt-progress')
        check('U88 推進到任務完成', await pg.locator(c + '.qt-complete').count() == 1 and await pg.is_disabled(c + '.qt-progress'))
        await pg.click(c + '.qt-collapse')
        check('U88 收合', await pg.is_hidden(c + '.qt-panel') and await A(c + '.qt-collapse', 'aria-expanded') == 'false')

        # U89 成就通知
        c = '#u89-achievement '
        for _ in range(3):
            await pg.click(c + '.ac-trigger')
        check('U89 最多 2 則，其餘排隊', await pg.locator(c + '.ac-toast').count() == 2 and '還有 1 個' in await T(c + '.ac-queue'))
        await pg.mouse.move(0, 0)
        await pg.wait_for_timeout(4400)
        check('U89 時間到依序顯示排隊中的成就', await pg.locator(c + '.ac-toast').count() == 1 and await T(c + '.ac-queue') == '')

        # U90 新手教學聚焦
        c = '#u90-coachmark '
        await pg.click(c + '.cm-start')
        check('U90 開始導覽：焦點在下一步', await pg.is_visible(c + '.cm-tip') and await active("document.activeElement.classList.contains('cm-next')"))
        await pg.keyboard.press('ArrowRight')
        check('U90 → 下一步', '步驟 2 / 3' in await T(c + '.cm-step'))
        await pg.keyboard.press('Escape')
        check('U90 Esc 略過並回到開始按鈕', await pg.locator(c + '.cm-tip').count() == 0 and await active("document.activeElement.classList.contains('cm-start')"))

        check('沒有執行錯誤', not errors, errors)
        await b.close()


asyncio.run(main())
print(f'{sum(results)} / {len(results)} 通過')
sys.exit(0 if all(results) else 1)
