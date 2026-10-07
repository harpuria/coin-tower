import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  build: {
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
