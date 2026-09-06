# JavaScriptコーディングルール

サイト制作でスクリプトを作成する際のルールをまとめたファイルです。

## 命名規則

| 種別       | 形式               | 例                        |
| ---------- | ------------------ | ------------------------- |
| 変数・関数 | `camelCase`        | `userName`, `getUserData` |
| 定数       | `UPPER_SNAKE_CASE` | `API_BASE_URL`            |
| クラス     | `PascalCase`       | `UserManager`             |

- 命名は英語。2バイト文字（日本語変数名等）は禁止
- ローマ字は代替がない場合のみ許可

---

## コードスタイル

- インデント: スペース2個
- セミコロン: 必須
- クォート: **シングルクォート**（文字列内にシングルが含まれる場合・テンプレートリテラルは例外）
- 末尾カンマ: オブジェクト・配列で推奨

```javascript
const config = {
  apiUrl: "https://api.example.com",
  timeout: 3000,
};
```

---

## DOM操作

```javascript
// js- クラスを使用
const trigger = document.querySelector(".js-modal-trigger");
const elements = [...document.querySelectorAll(".js-target")];

// 要素存在チェック必須
if (elements.length === 0) return;

// NG: スタイリング用クラスの使用禁止
// document.querySelector('.c-button')
```

- `js-` プレフィックスのクラスを使用（スタイリング用クラスは使用禁止）
- NodeList はスプレッド演算子で配列に変換
- イベントデリゲーションを活用
- スクロールイベントにはパッシブリスナーを使用

---

## クラス設計パターン

```javascript
class ComponentController {
  static CLASS_NAMES = {
    target: "js-component",
    isActive: "is-active",
  };

  static DEFAULT_OPTIONS = {
    duration: 300,
    easing: "ease-in-out",
  };

  constructor(element, options = {}) {
    this.options = { ...ComponentController.DEFAULT_OPTIONS, ...options };
    this.element = element;
    this.initEventListener();
  }

  initEventListener() {}
}

// 一括初期化パターン
const initComponent = () => {
  const elements = [...document.querySelectorAll(".js-component")];
  if (elements.length === 0) return null;

  return elements
    .map((el) => {
      try {
        return new ComponentController(el);
      } catch (error) {
        console.error(`[ComponentController]: ${error.message}`);
        return null;
      }
    })
    .filter(Boolean);
};
```

---

## ファイル構成

```
js/
├── main.js                 # エントリーポイント
├── modules/                # 機能別モジュール（ES6 Modules）
│   ├── modal.js
│   └── navigation.js
├── utils/                  # ユーティリティ
│   ├── dom.js
│   └── helpers.js
└── config/
    └── constants.js
```

---

## モジュールの使用

- モジュールの利用は認める。ただし、外部のライブラリやフレームワークを導入する場合、以下を除いて用途をオーナーに確認してから導入すること
- `yarn`コマンドでモジュールを組み込んでから使用する
- オーナーの許可不要で導入可能なJSライブラリ
  - スライダー（カルーセル）: Splide
  - スクロールアニメーション: GSAP(SCrollTrigger) or AOS
  - ライトボックス: PhotoSwipe

## セキュリティ・禁止事項

- `eval()` 禁止
- `document.write()` 禁止
- `innerHTML` への未サニタイズ文字列の挿入禁止 → `textContent` を使用
- グローバル変数の多用禁止
- `console.log` は本番コードから削除

```javascript
// XSS対策
element.textContent = userInput; // innerHTML ではなく textContent
```

---

## アクセシビリティ

```javascript
// ARIA属性の動的変更
function toggleModal(isOpen) {
  modal.setAttribute("aria-hidden", !isOpen);
  trigger.setAttribute("aria-expanded", isOpen);
}

// キーボード対応
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modalIsOpen) closeModal();
});
```
