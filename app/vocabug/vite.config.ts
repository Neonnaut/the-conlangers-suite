// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';
import banner from 'vite-plugin-banner'

import pkg from '../../package.json' with { type: 'json' };

export default defineConfig({
  plugins: [banner(`Program: ${pkg.name} -- version ${pkg.version} -- license: ${pkg.license} -- author: ${pkg.author}\nRepository: ${pkg.repository.url}`)],
  root: __dirname, // Tells Vite that 'app/' is the root
  build: {
    outDir: 'dist', // This sets the output directory
    rollupOptions: {
      input: {
        vocabug: resolve(__dirname, 'index.ts'), // Main entry
        worker: resolve(__dirname, 'worker.ts')

      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: 'assets/[name].[ext]',
      }
    }
  }
});
