import { defineConfig } from 'vite';
import nunjucks from 'nunjucks';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import autoprefixer from 'autoprefixer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = resolve(__dirname, 'src');

/**
 * Nunjucksテンプレートを処理するViteプラグイン
 * @param {Record<string, unknown>} variables - テンプレートに渡す共通変数
 */
const nunjucksPlugin = (variables = {}) => {
  let env;

  return {
    name: 'vite-nunjucks',
    configResolved() {
      env = nunjucks.configure(SRC_DIR, { autoescape: true });
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return env.renderString(html, variables);
      },
    },
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.njk')) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
  };
};

export default defineConfig({
  root: 'src',
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        // ページ追加例:
        // about: resolve(__dirname, 'src/about/index.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  plugins: [
    nunjucksPlugin({
      siteName: '**site name**',
      siteUrl: '',
    }),
  ],
  css: {
    postcss: {
      plugins: [autoprefixer()],
    },
  },
});
