import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { createHtmlPlugin } from 'vite-plugin-html';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({}),
    createHtmlPlugin({
      minify: true,
      entry: 'src/main.js',
      template: './index.html',
    }),
  ],
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    // watch: {
    //   include: [
    //     'src/**',
    //     '../modules/**'
    //   ]
    // }
  },
  resolve: {
    alias: [{
      find: /~(.+)/,
      replacement: path.join(__dirname, '../../node_modules/$1'),
    }, {
      find: /@\//,
      replacement: `${path.join(__dirname, 'src')}/`,
    }, {
      find: /&\//,
      replacement: `${path.join(__dirname, 'modules')}/`,
    }],
  },
});
