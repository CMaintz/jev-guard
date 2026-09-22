import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Excluded from the floor: the barrel, the types-only provider contract, and the
      // network adapters (fetch). Those are I/O edges / re-exports, covered by integration
      // tests later — the floor means "the guard logic".
      exclude: [
        'src/index.ts',
        'src/providers/cloudflare.ts',
        'src/providers/typesafe.ts',
        'src/providers/http.ts',
        'src/providers/jev-provider.ts',
      ],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 80,
      },
    },
  },
});
