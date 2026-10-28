"""Smoke test：主要互動、每個元件 × 每個狀態的預覽、手機寬度不溢出。
用法：python tests/smoke.py dist/ui-lab-minimal.html [截圖資料夾]
"""
import sys, asyncio, json
from playwright.async_api import async_playwright
import pathlib, os
PATH = str(pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'dist/ui-lab-minimal.html').resolve())
OUT = sys.argv[2] if len(sys.argv) > 2 else 'tests/output'
os.makedirs(OUT, exist_ok=True)

async def main():
    errors = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1280, 'height': 900})
        await ctx.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        page = await ctx.new_page()
        page.on('console', lambda m: errors.append('console:' + m.text) if m.type == 'error' else None)
        page.on('pageerror', lambda e: errors.append('pageerror:' + str(e)))
        await page.goto(pathlib.Path(PATH).as_uri())
        await page.wait_for_timeout(400)
        r = {}
        r['ready'] = await page.evaluate("[...document.querySelectorAll('.module')].filter(m=>!m.dataset.ready).map(m=>m.id)")
        r['hero'] = await page.text_content('#heroCount')
        r['chips'] = await page.evaluate("[...document.querySelectorAll('.index-chip')].map(c=>c.textContent.trim())")
        r['scopes'] = await page.evaluate("[...document.querySelectorAll('[data-scope]')].map(c=>c.textContent)")
        r['status'] = await page.text_content('#catalogStatus')
        r['guides'] = await page.evaluate("document.querySelectorAll('.module-guide').length")
        # search
        await page.fill('#catalogSearch', '日期'); await page.wait_for_timeout(50)
        r['search_日期'] = await page.evaluate("[...document.querySelectorAll('.module:not([hidden]) .module-id')].map(e=>e.textContent)")
        await page.fill('#catalogSearch', '篩選'); await page.wait_for_timeout(50)
        r['search_篩選'] = await page.evaluate("[...document.querySelectorAll('.module:not([hidden]) .module-id')].map(e=>e.textContent)")
        await page.fill('#catalogSearch', '')
        await page.select_option('#catalogCategory', 'display'); await page.wait_for_timeout(50)
        r['cat_display'] = await page.evaluate("[...document.querySelectorAll('.module:not([hidden]) .module-id')].map(e=>e.textContent)")
        await page.click('#catalogClear')

        M = lambda n: f'.module:has(.module-id:text-is("U{n}"))'
        # 46
        for _ in range(12):
            if await page.is_enabled(M(46)+' .num-btn >> nth=1'): await page.click(M(46)+' .num-btn >> nth=1')
        r['46'] = [await page.input_value(M(46)+' .num-input'), await page.is_disabled(M(46)+' .num-btn >> nth=1')]
        # 47
        await page.click(M(47)+' .combo-input'); await page.keyboard.type('台')
        r['47_opts'] = await page.locator(M(47)+' [role=option]').count()
        await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter')
        r['47_val'] = await page.input_value(M(47)+' .combo-input')
        # 48
        await page.click(M(48)+' .date-trigger')
        r['48_open'] = await page.is_visible(M(48)+' .date-pop')
        await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter')
        r['48_val'] = await page.text_content(M(48)+' .date-value')
        r['48_closed'] = not await page.is_visible(M(48)+' .date-pop')
        # 49
        await page.fill(M(49)+' .pw-input', 'Abcdefg1!')
        r['49'] = [await page.get_attribute(M(49)+' .pw-meter','data-level'), await page.text_content(M(49)+' .pw-msg')]
        await page.click(M(49)+' .pw-toggle'); r['49_type'] = await page.get_attribute(M(49)+' .pw-input','type')
        # 50
        await page.fill(M(50)+' textarea', '測試'*55)
        r['50'] = [await page.text_content(M(50)+' .ta-count'), await page.evaluate("const C=n=>[...document.querySelectorAll('.module')].find(m=>m.querySelector('.module-id').textContent==='U'+n);"+f"C(50).querySelector('textarea').style.height")]
        # 51
        nxt = page.locator(M(51)+' button:text("前往下一層")')
        await nxt.click(); await nxt.click()
        r['51'] = await page.text_content(M(51)+' .crumbs ol')
        await page.click(M(51)+' .crumb-more'); r['51_exp'] = await page.text_content(M(51)+' .crumbs ol')
        # 52
        await page.click(M(52)+' .pager-next'); await page.click(M(52)+' .pager-next'); await page.click(M(52)+' .pager-next')
        r['52'] = [await page.text_content(M(52)+' .pager'), await page.text_content(M(52)+' .pager-info')]
        # 53
        await page.click(M(53)+' .module-body button')
        r['53_open'] = await page.evaluate("!!document.querySelector('dialog.drawer[open]')")
        await page.screenshot(path=OUT+'/drawer.png')
        await page.keyboard.press('Escape'); await page.wait_for_timeout(100)
        r['53_after'] = await page.evaluate("[!!document.querySelector('dialog.drawer'), document.activeElement.textContent]")
        # 54
        await page.click(M(54)+' .alert-x >> nth=0')
        r['54'] = [await page.locator(M(54)+' .alert').count(), await page.evaluate("document.activeElement.getAttribute('aria-label')")]
        # 55
        await page.wait_for_timeout(1800)
        r['55'] = await page.is_visible(M(55)+' .skel-real')
        # 56
        await page.click(M(56)+' .empty-state button'); r['56'] = await page.locator(M(56)+' .empty-list li').count()
        # 57
        await page.click(M(57)+' .badge-add'); r['57'] = [await page.text_content(M(57)+' .badge-count'), await page.get_attribute(M(57)+' .badge-bell','aria-label')]
        # 58
        await page.click(M(58)+' th[data-key=qty] button'); await page.click(M(58)+' th[data-key=qty] button')
        r['58'] = [await page.get_attribute(M(58)+' th[data-key=qty]','aria-sort'), await page.text_content(M(58)+' tbody tr:first-child td:nth-child(2)')]
        await page.click(M(58)+' tbody tr:first-child input')
        r['58_sel'] = [await page.text_content(M(58)+' .table-meta'), await page.evaluate("const C=n=>[...document.querySelectorAll('.module')].find(m=>m.querySelector('.module-id').textContent==='U'+n);"+f"C(58).querySelector('thead input').indeterminate")]
        # 59
        await page.click(M(59)+' .avatar-more'); r['59'] = await page.locator(M(59)+' .avatar:not(.avatar-more)').count()
        # 60
        await page.click(M(60)+' [data-id="src/components"] > .tree-row')
        await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter')
        r['60'] = await page.evaluate("const C=n=>[...document.querySelectorAll('.module')].find(m=>m.querySelector('.module-id').textContent==='U'+n);"+f"[...C(60).querySelectorAll('[aria-selected=true]')].map(e=>e.dataset.id).concat(document.activeElement.dataset.id)")
        await page.keyboard.press('ArrowLeft'); r['60_left'] = await page.evaluate("document.activeElement.dataset.id")
        # 61
        await page.click(M(61)+' .car-nav >> nth=1')
        r['61'] = await page.evaluate("const C=n=>[...document.querySelectorAll('.module')].find(m=>m.querySelector('.module-id').textContent==='U'+n);"+f"C(61).querySelector('.car-track').style.transform")
        # 62
        await page.click(M(62)+' .pop-trigger'); r['62_open'] = await page.is_visible(M(62)+' .pop-panel')
        await page.keyboard.press('Escape'); r['62_closed'] = not await page.is_visible(M(62)+' .pop-panel')
        # reset button for a new card
        await page.click(M(52)+' .module-tools button:text("重設")')
        r['52_reset'] = await page.text_content(M(52)+' .pager-info')

        # screenshots
        await page.evaluate("document.getElementById('cat-display').scrollIntoView()")
        await page.screenshot(path=OUT+'/display_light.png')
        await page.evaluate("document.querySelector('.module-guide').open=true;document.getElementById('cat-input').scrollIntoView()")
        await page.screenshot(path=OUT+'/input_light.png', full_page=False)
        await page.evaluate("UILabStyle.set('theme','dark');document.getElementById('cat-feedback').scrollIntoView()")
        await page.wait_for_timeout(400)
        await page.screenshot(path=OUT+'/feedback_dark.png')
        await page.evaluate("UILabStyle.set('theme','light')")

        # inspector: every component × every state
        bad = []
        n = await page.locator('.module').count()
        for i in range(n):
            card = page.locator('.module').nth(i)
            cid = await card.locator('.module-id').text_content()
            await card.locator('.module-tools button:text("狀態與程式碼")').click()
            opts = await page.evaluate("[...document.querySelectorAll('dialog.inspector select option')].map(o=>o.value)")
            for o in opts:
                await page.select_option('dialog.inspector select', o)
                await page.wait_for_timeout(120)
                fr = [f for f in page.frames if f != page.main_frame]
                ok = False
                for f in fr:
                    try:
                        ok = ok or await f.evaluate("document.getElementById('export-root')?.dataset.ready||''") != ''
                    except Exception: pass
                if not ok: bad.append(f'{cid}:{o}')
            if cid == 'U58':
                await page.screenshot(path=OUT+'/inspector58.png')
            esc_ok = None
            await page.keyboard.press('Escape'); await page.wait_for_timeout(60)
            if await page.locator('dialog.inspector').count():
                bad.append(cid+':esc-did-not-close'); await page.click('dialog.inspector .inspector-head button'); await page.wait_for_timeout(30)
        r['inspector_bad'] = bad

        # mobile
        m = await b.new_page(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        m.on('pageerror', lambda e: errors.append('mobile pageerror:' + str(e)))
        await m.goto(pathlib.Path(PATH).as_uri()); await m.wait_for_timeout(300)
        r['mobile_overflow'] = await m.evaluate("document.documentElement.scrollWidth - innerWidth")
        await m.evaluate("document.getElementById('cat-display').scrollIntoView()")
        await m.screenshot(path=OUT+'/mobile_display.png')
        await b.close()
    r['errors'] = errors
    print(json.dumps(r, ensure_ascii=False, indent=1))
    real_errors = [e for e in errors if 'Failed to load resource' not in e]
    checks = {'所有元件已掛載': r['ready'] == [], '每個元件都有規範': r['guides'] == r['hero'] == '62' or r['guides'] == int(r['hero']),
              '檢視器每個狀態都能預覽': r['inspector_bad'] == [], '手機寬度不溢出': r['mobile_overflow'] <= 0, '沒有執行錯誤': not real_errors}
    for k, v in checks.items(): print('✓' if v else '✗', k)
    sys.exit(0 if all(checks.values()) else 1)

asyncio.run(main())
