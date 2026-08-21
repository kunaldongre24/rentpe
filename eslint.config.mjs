import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/node_modules/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettier,
  {
    files: ['apps/web/**/*.{ts,tsx,js,jsx}'],
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: false },
      ],
    },
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/next-env.d.ts'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/next-env.d.ts'],
    rules: { '@typescript-eslint/triple-slash-reference': 'off' },
  },
);
