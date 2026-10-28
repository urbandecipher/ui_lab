# UI LAB — 互動元件規範集

與框架無關的前端互動規範集。62 個元件，每個都能直接操作、切換狀態，附「何時用／何時不用」、結構拆解、鍵盤操作表、文案規則（遊戲元件另附 Godot 4 節點對應），並匯出可離線執行的 HTML、CSS 與 JavaScript。頁面內含設計變數總表，可下載 tokens.css／tokens.json。

- **交付物**：`dist/ui-lab-minimal.html`，單一檔案、零外部相依，直接用瀏覽器開啟。
- **原始碼**：`src/`，每個元件一個資料夾，由 `build.mjs` 組成單檔。

## 快速開始

```bash
node build.mjs          # 建置 → dist/ui-lab-minimal.html
node build.mjs --check  # 只檢查來源（欄位、編號、狀態名稱），不輸出
```

需要 Node.js 18 以上，不需要 `npm install`。

## 目錄結構

```
src/
  page.html               頁面骨架（標題、搜尋列、工作台、版本紀錄），以 <!--@…--> 佔位
  categories.json         分類：順序、名稱、說明
  state-labels.json       狀態代碼 → 中文名稱（狀態選單用）
  styles/
    tokens.css            設計變數（顏色、圓角、間距、陰影、字體、動態時間、深色與外觀變體）；頁面總表由此自動產生
    base.css              多個元件共用的規則
    overrides.css         必須排在元件樣式之後的共用規則（外觀設定、觸控尺寸）
    page.css              圖鑑頁面本身的樣式，不會進入元件匯出
  runtime/core.js         元件執行環境：UILab.define() 註冊、mountDemo() 掛載
  app/                    圖鑑功能：外觀設定、搜尋篩選、檢視器與匯出、工作台
  components/
    u48-date-picker/
      component.json      規格：編號、名稱、分類、搜尋別名、使用規範、狀態、操作說明、結構、鍵盤、文案、Godot 對應
      markup.html         元件標記（.module-body 內的內容）
      style.css           此元件專屬樣式（可省略）
      demo.js             互動程式：UILab.define(48, ctx => { … })
tests/                    Playwright 測試（smoke、同頁多實例）
```

## 新增一個元件

1. 複製任一元件資料夾，改名為 `uNN-slug`（例如 `u63-time-picker`）。
2. 編輯 `component.json`：`number` 與資料夾編號一致；`category` 要對應 `categories.json` 的 `key`；`states` 只能用 `state-labels.json` 裡有的代碼，新狀態要先加到那裡。規格欄位（建置會檢查）：

   | 欄位 | 內容 |
   |---|---|
   | `guide.use` / `guide.avoid` | 何時用、何時不用 |
   | `anatomy` | 組成部分與對應的 class、ARIA 角色 |
   | `keyboard` | `[按鍵, 動作]` 陣列，**照 demo.js 實際處理的按鍵寫** |
   | `content` | 文案規則 |
   | `godot` | 遊戲分類必填：`tree`（節點樹，每行一個字串）與 `notes`（實作重點） |

3. 寫 `markup.html`、`style.css`、`demo.js`。`demo.js` 的第一個參數是 `ctx`，常用的有：

   | 名稱 | 用途 |
   |---|---|
   | `q` / `all` | 在元件內查詢元素；`'#id'` 會自動對應到此實例的 ID |
   | `on` | 綁定事件，重設或卸載時自動解除 |
   | `later` / `frame` / `animate` | 計時與動畫，重設時自動清除 |
   | `uid('name')` | 產生此實例專屬的 ID，給 `aria-controls` 等參照使用 |
   | `say('…')` | 讀屏播報 |
   | `preset` | 目前狀態代碼（`default`、`expanded`…），用來設定初始畫面 |
   | `isReducedMotion()` | 是否減少動態效果 |

4. `node build.mjs`，分類數量、搜尋、檢視器、匯出都會自動更新。

**規則**：`markup.html` 不寫 inline 事件（`onclick` 等）；元件內的 ID 可以照常寫，執行時會自動加前綴，所以同一頁可放多個相同元件。

## 匯出

檢視器的「完整 HTML」只包含：設計變數 + 該元件實際用到的共用規則 + 元件樣式 + 核心執行環境 + 元件程式。建置時會分析每個元件用到的 class，所以單一元件匯出約 15–25 KB（v4 每份約 85 KB）。

同一頁放多個實例：

```html
<div class="module" id="a" data-demo="48">…</div>
<div class="module" id="b" data-demo="48">…</div>
<script>mountDemo(document.getElementById('a'), 48); mountDemo(document.getElementById('b'), 48);</script>
```

## 測試

```bash
pip install playwright && python -m playwright install chromium
python tests/smoke.py dist/ui-lab-minimal.html          # 互動、每個元件 × 每個狀態、手機寬度
python tests/multi_instance.py dist/ui-lab-minimal.html # 每個元件放兩份：ID 不重複、互不干擾
```

## 持續檢查與發佈

- 每次推送都會執行 `.github/workflows/ci.yml`：重新建置並確認 `dist/` 與 `src/` 一致。改完原始碼記得先 `node build.mjs` 再提交。
- `.github/workflows/pages.yml` 可發佈到 GitHub Pages，目前設為手動執行（私人 repo 需付費方案才能用 Pages）。
