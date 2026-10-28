"""同頁多實例測試：每個元件匯出後放兩份，檢查 ID 不重複、參照不跨實例、互動彼此獨立。
用法：python tests/multi_instance.py dist/ui-lab-minimal.html
"""
import sys, asyncio, pathlib
from playwright.async_api import async_playwright

PAGE = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'dist/ui-lab-minimal.html').resolve()
CHECK = """() => {
  const problems = [];
  const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) problems.push('重複 ID：' + [...new Set(dup)].join(', '));
  const roots = [document.getElementById('export-root'), document.getElementById('export-root-2')];
  for (const attr of ['for', 'aria-controls', 'aria-labelledby', 'aria-describedby', 'aria-activedescendant']) {
    document.querySelectorAll('[' + attr + ']').forEach(el => {
      const owner = roots.find(r => r.contains(el));
      if (!owner) return;
      for (const id of el.getAttribute(attr).split(/\\s+/)) {
        const target = document.getElementById(id);
        if (!target) { if (attr !== 'aria-activedescendant') problems.push(attr + ' 指向不存在的 ' + id); continue; }
        const other = roots.find(r => r !== owner && r.contains(target));
        if (other) problems.push(attr + '="' + id + '" 跨到另一個實例');
      }
    });
  }
  const names = r => [...r.querySelectorAll('input[type=radio]')].map(i => i.name);
  if (names(roots[0]).some(n => names(roots[1]).includes(n))) problems.push('radio name 在兩個實例間共用');
  return problems;
}"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1280, 'height': 900})
        await pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        await pg.goto(PAGE.as_uri()); await pg.wait_for_timeout(300)
        page_dups = await pg.evaluate("(() => {const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return ids.filter((x,i)=>ids.indexOf(x)!==i);})()")
        exports = {}
        for i in range(await pg.locator('.module').count()):
            card = pg.locator('.module').nth(i)
            cid = (await card.locator('.module-id').text_content()).strip()
            await card.locator('[data-action="inspect"]').click()
            await pg.click('dialog.inspector .source-tabs button:text("完整 HTML")')
            exports[cid] = await pg.input_value('dialog.inspector textarea')
            await pg.click('dialog.inspector .inspector-head button')
        failures = []
        t = await b.new_page(viewport={'width': 900, 'height': 1400})
        errors = []
        t.on('pageerror', lambda e: errors.append(str(e)))
        for cid, html in exports.items():
            n = cid[1:]
            body = html.split('<body>\n', 1)[1].split('\n<script>', 1)[0]
            second = body.replace('id="export-root"', 'id="export-root-2"', 1)
            html2 = html.replace('\n<script>', '\n' + second + '\n<script>', 1).replace(
                '\n</script>\n</body>', '\nmountDemo(document.getElementById("export-root-2"), ' + n + ');\n</script>\n</body>', 1)
            errors.clear()
            await t.set_content(html2); await t.wait_for_timeout(150)
            probs = await t.evaluate(CHECK)
            if errors: probs.append('執行錯誤：' + errors[0])
            if probs: failures.append((cid, probs))
        # behaviour: the two instances must not affect each other
        async def load(cid):
            n = cid[1:]; html = exports[cid]
            body = html.split('<body>\n', 1)[1].split('\n<script>', 1)[0]
            html2 = html.replace('\n<script>', '\n' + body.replace('id="export-root"', 'id="export-root-2"', 1) + '\n<script>', 1).replace(
                '\n</script>\n</body>', '\nmountDemo(document.getElementById("export-root-2"), ' + n + ');\n</script>\n</body>', 1)
            await t.set_content(html2); await t.wait_for_timeout(150)
        A, B = '#export-root', '#export-root-2'
        behaviour = {}
        await load('U45')
        await t.click(B + ' .radio-card >> nth=2')
        behaviour['U45 單選互不影響'] = await t.evaluate(f"[document.querySelector('{A} input:checked').value, document.querySelector('{B} input:checked').value]") == ['基本', '團隊']
        await load('U4')
        await t.click(B + ' [role=tab] >> nth=2')
        behaviour['U4 分頁互不影響'] = await t.evaluate(f"[[...document.querySelectorAll('{A} [role=tab]')].findIndex(x=>x.getAttribute('aria-selected')==='true'), [...document.querySelectorAll('{B} [role=tab]')].findIndex(x=>x.getAttribute('aria-selected')==='true')]") == [0, 2]
        await load('U48')
        await t.click(B + ' .date-trigger')
        behaviour['U48 只開啟第二個日曆'] = await t.evaluate(f"[document.querySelector('{A} .date-pop').hidden, document.querySelector('{B} .date-pop').hidden]") == [True, False]
        await load('U47')
        await t.click(B + ' .combo-input'); await t.keyboard.type('台')
        behaviour['U47 建議清單各自獨立'] = await t.evaluate(f"[document.querySelector('{A} .combo-list').hidden, document.querySelectorAll('{B} [role=option]').length]") == [True, 4]
        await b.close()
    print('目錄頁重複 ID：', page_dups or '無')
    print('多實例結構檢查：', len(exports), '個元件，問題', len(failures))
    for cid, probs in failures: print(' ', cid, probs[:3])
    for k, v in behaviour.items(): print(' ', '✓' if v is True else '✗', k)
    ok = not page_dups and not failures and all(v is True for v in behaviour.values())
    print('結果：', '通過' if ok else '失敗')
    sys.exit(0 if ok else 1)

asyncio.run(main())
