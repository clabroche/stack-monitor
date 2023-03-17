import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { createHtmlPlugin } from 'vite-plugin-html'
import analyze from 'rollup-plugin-analyzer'
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  rollupInputOptions: {
    plugins: [analyze]
  },
  plugins: [
    vue({}),
    visualizer(),
    {
      name: 'custom-hmr',
      enforce: 'post',
      // HMR
      handleHotUpdate({ file, server }) {
        const filePath = file.replace(__dirname, '')
        if (filePath.startsWith('/modules') && filePath.endsWith('.vue')) {
          server.ws.send({
            type: 'full-reload',
            path: '*'
          });
        }
      },
    },
    createHtmlPlugin({
      minify: true,
      entry: 'src/main.js',
      template: './index.html',
    })
  ],
  build: {
    outDir: path.resolve(__dirname, 'server','public'),
    // watch: {
    //   include: [
    //     'src/**',
    //     '../modules/**'
    //   ]
    // }
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
