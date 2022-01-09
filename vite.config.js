import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { minifyHtml } from 'vite-plugin-html'
import analyze from 'rollup-plugin-analyzer'
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  rollupInputOptions: {
    plugins: [analyze]
  },
  plugins: [
    vue(),
    visualizer(),
    minifyHtml(),
  ],
  build: {
    outDir: path.resolve(__dirname, 'server','public')
  },
  resolve: {
    alias:[{
        find: /~(.+)/,
        replacement: path.join(__dirname, 'node_modules/$1'),
      },

      {
        find: /@\//,
        replacement: path.join(__dirname, 'src') + '/',
      },]
    }

})
