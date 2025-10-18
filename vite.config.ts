import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      port: 3000,
      host: true,
      strictPort: true
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate'
      })
    ],
    define: {
      'process.env': JSON.stringify(env)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'assets': path.resolve(__dirname, './src/assets'),
        'styles': path.resolve(__dirname, './src/styles')
      }
    },
    build: {
      sourcemap: true,
      outDir: 'dist',
      minify: 'terser',
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash][extname]',
          chunkFileNames: 'js/[name].[hash].js',
          entryFileNames: 'js/[name].[hash].js'
        }
      },
      assetsInlineLimit: 4096
    }
  };
});
