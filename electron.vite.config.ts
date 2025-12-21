import { defineConfig, externalizeDepsPlugin, swcPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

const rendererRoot = resolve(__dirname, 'src/renderer');

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({
      exclude: [
        'reflect-metadata',
        'electron-store',
        'conf',
        'type-fest',
        'ajv',
        'ajv-formats',
        'atomically',
        'debounce-fn',
        'dot-prop',
        'env-paths',
        'json-schema-typed',
        'semver',
        'uint8array-extras',
      ]
    }), swcPlugin()],
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts')
        },
        external: ['electron']
      }
    },
    resolve: {
      alias: {
        '@nest': resolve(__dirname, 'src/main/nest')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts')
        },
        external: ['electron']
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: resolve(__dirname, 'src/renderer/index.html')
      }
    },
    plugins: [react(), tailwindcss()],
    worker: {
      format: 'es'
    },
    resolve: {
      alias: {
        '@/': `${rendererRoot}/src/`,
        '@components/': `${rendererRoot}/src/components/`,
        '@editor/': `${rendererRoot}/src/components/editor/`,
        '@checklist/': `${rendererRoot}/src/components/checklist/`,
        '@type/': `${rendererRoot}/src/type/`,
        '@api/': `${rendererRoot}/src/api/`,
        '@ui/': `${rendererRoot}/src/components/ui/`,
        '@resumeForm/': `${rendererRoot}/src/components/resumeForm/`,
        '@upload/': `${rendererRoot}/src/components/upload/`,
        '@hooks/': `${rendererRoot}/src/hooks/`,
        '@dashboard/': `${rendererRoot}/src/components/dashboard/`,
        '@templates/': `${rendererRoot}/src/templates/`,
        '@typst-compiler/': `${rendererRoot}/src/typst-compiler/`,
        '@utils/': `${rendererRoot}/src/utils/`,
        '@workflow/': `${rendererRoot}/src/workflow/`,
        '@tips/': `${rendererRoot}/src/tips/`,
      }
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          ws: true,
        },
      },
    }
  }
});
