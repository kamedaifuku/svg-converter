# 自分用 Vite + FLOCSS + Nunjucks テンプレート

テンプレートの構成とCSSやSCSSの設定についてをまとめたファイルです。
サイト制作時は以下のルールを用いてください。

- **ビルドツール**: [Vite](https://vitejs.dev/)
- **HTMLテンプレート**: [Nunjucks](https://mozilla.github.io/nunjucks/)（共用パーツのテンプレート化）
  - パーシャル化の対象は**複数ページで共通利用される構造ブロック単位**に限定する
  - UIパーツ（ボタン・カード等）はFLOCSSのクラス設計で対応し、Nunjucksマクロには切り出さない
- **CSS**: SCSS（FLOCSS + BEM 記法）
- **JavaScript**: ES Modules（`tsconfig.json` は将来のTypeScript移行用に保持）
- class の命名規則はオリジナルの[FLOCSS](https://github.com/hiloki/flocss)をベースにカスタマイズしている。
- リキッドレイアウト対応として、サイズ指定は clamp 関数を使って Viewport に応じて表示サイズを拡縮する形を想定。

## プロジェクト構成

```
siteTemplate/
├── src/
│   ├── index.html              ← Viteエントリー（Nunjucks構文）
│   ├── _templates/
│   │   ├── base.njk            ← 基底テンプレート（head・body全体）
│   │   └── partials/
│   │       ├── header.njk
│   │       └── footer.njk
│   ├── assets/images/
│   ├── scss/                   ← FLOCSS構成
│   │   ├── style.scss
│   │   ├── base/
│   │   ├── global/
│   │   ├── reset/
│   │   ├── layout/
│   │   ├── component/
│   │   ├── project/
│   │   └── utility/
│   └── js/
│       ├── main.js
│       ├── config/constants.js
│       ├── modules/
│       └── utils/
├── public/
│   ├── robots.txt
│   └── svgs/site-logo.svg
├── vite.config.js              ← Nunjucksプラグイン内蔵
├── package.json
├── tsconfig.json
├── yarn.lock
└── .gitignore
```

## 使い方

```bash
yarn dev      # 開発サーバー起動（オートリロード有り）
yarn build    # dist/ にビルド
yarn preview  # ビルド結果をプレビュー
```

### ページ追加時

[vite.config.js](./vite.config.js) の `rollupOptions.input` にエントリーを追加し、`src/` 以下に同名の `.html` ファイルを作成する。

```js
input: {
  top:   resolve(__dirname, 'src/index.html'),
  about: resolve(__dirname, 'src/about/index.html'), // ← 追加
},
```

### テンプレート共通データの変更

[vite.config.js](./vite.config.js) の `nunjucksPlugin()` に渡すオブジェクトを編集する。

```js
nunjucksPlugin({
  siteName: 'サイト名',
  siteUrl: 'https://example.com',
}),
```

---

## CSSとclass（セレクタ）の命名規則の基本ルール・構成

### 文法

- BEM 記法をベースに Block, Element 名はケバブケースで記載
- Block と Element の間はアンダースコア 2 つのスネークケースで区切る。
- **Modifier は別クラスとして分離**する。
- CSS セレクタは Modifier を where でくくることで詳細度を高めないようにする。

【記載例】

```html
<!-- HTMLのclass -->
class="p-block-name__element-name m-modifier"
```

```css
/* CSSのセレクタ */
.p-block-name__element-name: where(.m-modifier);
```

### レイヤー構成

- Reset
- Base
- Layout
- Component
- Project
- Modifier
- Utility
- JavaScript
- Status

### Reset

リセット CSS。自作はせずにトレンドの物を用いる。
冒頭に出典を明記すること。  
※現在使用している物：[`@acab/reset.css`](https://github.com/mayank99/reset.css/blob/main/package/index.css)

### Base

サイト全体で用いる設定。例として以下の物を定義

1. SCSS 側の変数・関数の指定
   - \_functions.scss（関数）
   - \_mixin.scss（mixin：メディアクエリ）
   - \_colors.scss（色の指定）
   - \_fonts.scss（フォントの指定）
   - \_contents-sizes.scss（コンテンツ幅・ブレークポイント）
   - \_z-index.scss（z-index の定義）

2. CSS の基本設定（`scss/global/` フォルダに配置）
   - \_css-vars.scss  
     `:root`に設定する CSS 変数（リキッドレイアウト用の変数など）
   - \_root-and-body.scss  
     `body`に設定するサイト全体のフォントや背景の既定値
   - \_elements-default.scss  
     各要素（タグ）の基本的なスタイル
   - \_hidden-reCaptcha.scss  
     reCAPTCHA バッジの非表示設定

### Layout

- 各ページの基本構造を定義するために用いる。
- 原則各ページに 1 つのみのユニークな要素。
- 色やフォントなどの見栄え、内包する要素の配置のスタイリングは行わない。  
  （同名の project で行う）
- セレクタの命名規則
  - プレフィックス= `l-`
  - 状況に応じて ID で指定するのも許容  
    ※ID で設定する場合は詳細度を高めないようにする。例） `:where(#foo)`
- body 直下を`l-body-wrapper`でラップし、ヘッダー、メイン、フッターなどの子要素を grid-area としてレイアウトする。

### Component

- 再利用を前提とした最小限の機能。
- ボタン、見出し、テキスト、画像、エフェクトやシンプルなフレックスやグリッド構造も含む。
- マルチページのサイトでの流用するヘッダー、フッター、サイドメニューもコンポーネントとして扱う。
- 色やサイズの指定は可変にするのが望ましい。
- 同一の機能の色やサイズ違いのバリエーションを作る場合は Modifier の別クラスを用いる。
- ネストは原則 2 段階（子・孫要素）まで
- セレクタの命名規則
  - プレフィックス= `c-`
  - 記載例:  
    親要素　: c-foo  
    子孫要素: c-foo\_\_{element}

### Project

- ページ・セクション固有のパターン。いくつかの Component・子 Project を格納する。
- 各パーツの配置やサイズ、使用する色などをまとめる。
- ネストは原則 2 段階（子・孫要素）まで
- Project の中に、役割を細分化できる機能群（カード・リスト・表等）がある場合、  
  別の Project や Component として定義して詳細を設定する。
- セレクタの命名規則
  - プレフィックス= `p-`
  - 記載例:  
    親要素　: p-foo  
    子孫要素: p-foo\_\_{element}

### Modifier

- Component や Project のバリエーションの作成に用いる。
- **単独のセレクタとしてスタイリングは行わない**。  
  必ず Component・Project のクラスとセットで運用する。
- 原則親要素に設定し、ネストを利用し:where を用いてセレクタで指定する。
- セレクタの命名規則
  - プレフィックス= `m-`
  - 記載例:  
    &:where(.m-bar)

### Utility

- Component、Project では定義しきれない細かい調整に用いる。
- 細かい余白（margin, padding）の設定など、単独で機能し、単一のスタイルを指定する。
- Utility は Element は持たず、別クラスの Modifier も設定しない。
- **※多用しないこと**
- セレクタの命名規則
  - プレフィックス= `u-`
  - 記載例:  
    u-foo

### Javascript

- JavaScript で要素を取得・操作するための識別用セレクタ。
- この class 名をセレクタとして使用してスタイリングは行わない。
- セレクタの命名規則
  - プレフィックス= `js-`
  - 例）
    js-{js のクラス名}-{要素・項目名}

### Status

- 主に JavaScript でコンテンツを変化させる際に、要素の状態を指定するために用いる。
- コンポーネントもしくはプロジェクトとセットで利用し、単独のスタイリングは行わない。
- セレクタの命名規則
  - プレフィックス= `is-`
  - 記載例:  
    is-{状態}, is-active, is-show, is-hidden ...  
    .p-modal.is-open

## リキッドレイアウト&Web アクセシビリティ対応

- サイズに関する単位の指定は原則**`liquid()`**で行うこと。
- liquid関数の思想:
  clamp 関数による記述を最小限にするために、基本的に`:root`にカスタムプロパティでベースサイズを定義し、各プロパティでのサイズ指定は`calc()`でベースサイズに乗算する形にしている。→これをSASSの関数に落とし込んだものが`liquid()`。詳細は後述。
- 単位を指定する場合は`rem()` での指定をベースとする。px のような絶対長の単位は原則使わない。
- 上記の指定には SCSS 関数とカスタムプロパティを用いてコーディングの負担を軽減する。
- 文字サイズに応じて余白等を変える component などでは`em`単位を利用も想定。

### `:root`に指定するベースサイズ

- 原則デスクトップ（PC）とモバイル端末（SP）それぞれにベースサイズを定義する。
  - **PC 版のベースサイズ：**  
    SP 版デザインへのブレークポイントからコンテンツ幅までの範囲でサイズを変動させる。  
    最大値は viewport がコンテンツ幅と一致するときに 1rem(=16px)とし、そこから viewpoint に比例してブレークポイントの数値までサイズを変動させる。

  - **SP 版のベースサイズ：**  
    配慮する最小サイズのモバイルの画面幅から SP 版デザインのアートボードの幅までの範囲でサイズを変動させる。  
    最大値は 1rem(=16px)とし、そこから viewpoint に比例してブレークポイントの数値までサイズを変動させる。
    - SP 版のリキッドレイアウト対応は JavaScript による Viewport の固定する方法も考慮

- 定義例（`scss/global/_css-vars.scss` の実装）

```scss
:root {
  // SP版 最小幅: $vw-sp-min(300px), アートボード幅: $vw-sp-max(390px)
  --liquid-size-sp: #{clampWithPxToRem(12, 16, $vw-sp-min, $vw-sp-max)};
  // PC版 SPブレークポイント: $vw-pc-min(768px), コンテンツ幅: $vw-pc-max(1280px)
  --liquid-size-pc: #{clampWithPxToRem(10, 16, $vw-pc-min, $vw-pc-max)};

  // デフォルト（PC）: SP変数はPC幅では1remに固定されるため基準値として利用
  --liquid-size: var(--liquid-size-sp);

  @include mq() { // @media (width < 768px)
    --liquid-size: var(--liquid-size-pc);
  }
}
```

- ブレークポイントの実値は `scss/base/_contents-sizes.scss` で定義
- `@include mq()` は `scss/base/_mixin.scss` の PCファースト設定（`$is-sp-first: false`）に従い `(width < 768px)` を生成

### 入力補助用の SASS 関数

計算式のコード入力の簡略化と可読性を考慮して以下の SASS 関数を使用する。  
関数式の詳細は[\_functions.scss](./src/scss/base/_functions.scss)を参照。

#### **rem()**

- 1rem=16px として、引数の px 単位の数値を rem 単位の値で返す関数。

```scss
// SCSS　サンプル
rem(24) // -> 1.5rem
```

#### **em()**

- 第１引数を第２引数で除算した em 単位の値を返す関数。
- 引数は px 単位で指定
- 第２引数を省略値は`16`

```scss
// SCSS　サンプル
em(20, 16) // -> 1.25em
```

#### **clampWithPxToRem()**

- `clamp()`の入力補助用の関数。
- 引数は最小サイズ・最大サイズ・最小 Viewport・最大 Viewport の 4 つで、それぞれ px 単位の数値を入力する。
- vw に応じて 1 次式で値が変化する`clamp()`を返す。

```scss
// SCSS　サンプル
clampWithPxToRem(8, 16, 768, 1280)
 // -> clamp(0.5rem, 1.172vw + 0.063rem, 1rem)
```

#### **liquid()**

- レキッドレイアウトでサイトを構成する場合は**原則`liquid()`を使用する。**
- px 値を乗数として{ベースサイズ \* 乗数}の形式の`calc()`に変換する関数。
- 第 1 引数に px 値・第 2 引数に使用するベースサイズのカスタムプロパティを指定する。
  - 選択できる第 2 引数（※省略する場合は"base"）  
    "base" : "--liquid-size"  
    "pc" : "--liquid-size-pc"  
    "sp" : "--liquid-size-sp"
- 1rem=16px として変換した`calc()`を得る。

```scss
// SCSS　サンプル
liquid(16, base)
 // -> calc(var(--liquid-size) * 1)
```
