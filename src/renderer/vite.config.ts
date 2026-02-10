import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '../..')

export default defineConfig({
  plugins: [
    viteReact(),
    tailwindcss(),
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@/': `${__dirname}/src/`,
      '@components/': `${__dirname}/src/components/`,
      '@editor/': `${__dirname}/src/components/editor/`,
      '@checklist/': `${__dirname}/src/components/checklist/`,
      '@type/': resolve(__dirname, '../shared/type') + '/',
      '@api/': `${__dirname}/src/api/`,
      '@ui/': `${__dirname}/src/components/ui/`,
      '@resumeForm/': `${__dirname}/src/components/resumeForm/`,
      '@upload/': `${__dirname}/src/components/upload/`,
      '@hooks/': `${__dirname}/src/hooks/`,
      '@dashboard/': `${__dirname}/src/components/dashboard/`,
      '@templates/': `${__dirname}/src/templates/`,
      '@typst-compiler/': `${__dirname}/src/typst-compiler/`,
      '@utils/': `${__dirname}/src/utils/`,
      '@workflow/': `${__dirname}/src/workflow/`,
      '@sidebar/': `${__dirname}/src/components/sidebar/`,
      '@layout/': `${__dirname}/src/components/layout/`,
      '@root': rootDir,
    },
  },
})
