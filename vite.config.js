import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { minifyHtml } from 'vite-plugin-html'
import legacy from '@vitejs/plugin-legacy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    minifyHtml(),
    legacy({
      targets: ['ie >= 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
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
