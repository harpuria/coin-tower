import { defineConfig } from 'vitest/config';
import { packageArt } from './scripts/package-art.ts';

export default defineConfig({
  base: './',
  plugins: [packageArt()],
  build: {
    copyPublicDir: false,
    rolldownOptions: {
      output: {
        manualChunks: (id: string) =>
          id.includes('/node_modules/phaser/') ? 'phaser' : undefined,
      },
    },
    chunkSizeWarningLimit: 1600,
  },
  test: { include: ['tests/unit/**/*.test.ts'] },
});
