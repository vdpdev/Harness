import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import promise from 'eslint-plugin-promise';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    plugins: { promise, sonarjs, unicorn, 'unused-imports': unusedImports },
    rules: {
      'promise/param-names': 'error',
      'sonarjs/no-duplicate-string': 'warn',
      'unicorn/prefer-module': 'error',
      'unicorn/filename-case': ['error', { case: 'kebabCase', ignore: ['/README\\.md$/'] }],
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // scripts/ excluded: barrel imports and cross-module re-exports trigger
    // unused-imports noise.
    ignores: ['dist/', 'node_modules/', '.tmp/', 'scripts/'],
  },
  {
    files: ['bin/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        import: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
    },
  },
);
