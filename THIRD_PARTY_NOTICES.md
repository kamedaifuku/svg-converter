# Third-party notices

## VTracer

- Package: `@visioncortex/vtracer@1.0.0-alpha.4` (pinned prerelease)
- Source: https://github.com/visioncortex/vtracer/tree/2500df76b5aea0ac22d15296b22722442f825c5b
- Copyright (c) 2024 TSANG, Hao Fung
- License: MIT; full text is distributed at `public/licenses/vtracer-MIT.txt`.
- The official npm Wasm binary is copied without modifications into `src/js/vendor/vtracer/`.
- `scripts/prepare-vtracer.mjs` adapts the generated CommonJS glue into an ES module and replaces synchronous filesystem loading with browser `fetch` and asynchronous instantiation. It does not change the tracing algorithm.
- Both input artifacts are verified by SHA-256 before adaptation. Upgrade the package and adapter deliberately, then rerun conversion tests.

The reset stylesheet includes its original attribution in `src/scss/reset/_reset.scss`.
