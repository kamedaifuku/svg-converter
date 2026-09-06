# SVG変換室

PNG・JPEG・WebPを、ブラウザ内のVTracerでSVGに変換する1ページのツールです。
TypeScript / Vite / Nunjucks / SCSSを使用しています。React・変換API・画像アップロードはありません。

## 開発

Node.js 22以降、Yarn 4.18.0を使用します。`.yarnrc.yml` の `nodeLinker: node-modules` により、依存関係は `node_modules/` に配置します。

```sh
yarn install --immutable
yarn dev
yarn build
yarn preview
yarn test
```

`yarn build` はTypeScriptのstrict型チェック後に `dist/` を作成します。
通常のビルドにRustは不要です。`src/js/vendor/vtracer/` の生成済みWasmと接続コードをリポジトリに含めています。

Windowsで依存関係を入れ直すときは、先に `yarn dev` / `yarn preview` をCtrl+Cで停止してください。起動中は `esbuild.exe` がロックされ、インストール時に `EPERM ... unlink` が発生することがあります。

## 変換エンジン

公式 `@visioncortex/vtracer@1.0.0-alpha.4` のWasmを使用しています。現在の採用版はプレリリースのため、バージョンを固定しています。
Node向けパッケージ全体をブラウザに読み込まず、Wasmとその生成された接続コードのみを使用します。

```sh
yarn wasm:prepare
yarn test
yarn build
```

再生成は公式配布物のSHA-256を検証したうえで、CommonJS exportとNodeのファイル読み込み部分のみを変換します。
上流の版・出典・ライセンスは [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) を参照してください。
新しい版を使う際はハッシュだけを変更せず、接続コードの互換性を確認してください。

## Cloudflare Pages

1. このリポジトリをGitHubまたはGitLabへpushします。
2. Cloudflare Pagesでリポジトリを連携し、公開対象ブランチを選択します。
3. ルートディレクトリはリポジトリ直下、ビルドコマンドは `yarn build`、出力ディレクトリは `dist` に設定します。
4. ビルド環境のNode.jsを22系、Yarnを4.18.0に合わせます。
5. 公開URLでサンプル変換とSVG保存を確認してください。

`public/_headers` はWasmのContent-Typeを指定します。WorkerもWasmも同一オリジンの静的ファイルとして配信します。
ブラウザのWeb Workerを使用しており、Cloudflare WorkersやPages Functionsの実行処理は不要です。
マルチスレッドWasm / SharedArrayBufferを使わないため、COOP/COEPヘッダーも不要です。

## 初期版の仕様

- 入力：1枚ずつ、20 MiBまで、PNG・JPEG・WebP。ブラウザでデコード後、2400万画素を超える画像を拒否します。
- 変換サイズ：長辺1600 px、約160万画素まで。超える場合は縦横比を保って縮小し、寸法を表示します。
- 透明度：完全透明はカラーで保持、半透明は白に合成して不透明化。白黒は透明部分を白として処理します。
- アニメーション画像：ブラウザがデコードした静止フレームのみを使用します。
- プリセット：ロゴ、イラスト、白黒線画、ピクセルアート。手動変更時はカスタムになります。
- 変換はボタンで実行。設定変更・画像変更で古い出力を無効化します。
- 変換ごとにWorkerを作り、完了・失敗・キャンセル時に終了してWasmメモリを解放します。
- 正確な進捗率はAPIから得られないため、読み込み中／変換中の状態を表示します。120秒で打ち切ります。
- プレビューのSVGはBlob URLのimgとして表示し、SVG文字列をページのHTMLへ挿入しません。
- 比較倍率は変換後の寸法が基準です。拡大時は左右のスクロールが連動します。
- 画像は保存・送信しません。ページを再読み込みすると作業内容は消えます。
- 写真は容量が増える場合があります。OCR・背景除去・SVGのパス編集・一括変換は含みません。

## 構成

`src/js/modules/` に入力と変換の連携、設定、プレビュー、出力を配置しています。
`src/js/workers/` がWasm呼び出し、`src/js/utils/` が画像展開と共通処理です。
アプリケーションのスクリプトはTypeScriptです。Vite設定・再生成スクリプト・上流生成コードはJavaScriptです。
