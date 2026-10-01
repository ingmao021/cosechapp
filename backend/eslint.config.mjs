// Lint del backend (NestJS). Separado del eslint.config.js de la raíz, que tiene reglas de Angular.
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'prisma.config.ts', 'eslint.config.mjs', 'test/jest-e2e.config.js', 'jest.config.js'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      // Los repositorios Prisma y los mocks de pruebas trabajan con filas sin tipar.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);
