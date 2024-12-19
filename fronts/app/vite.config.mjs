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

  server: {
    port: 5173,
    host: '0.0.0.0',
    cors: false,
    hmr: {
      host: '0.0.0.0',
      port: 5173,
      protocol: 'ws',
      clientPort: 5173,
    },
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
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/assets/theme/_mixin";',
      },
    },
  },
});
