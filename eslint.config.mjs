import js from '@eslint/js';
import pluginTs from '@typescript-eslint/eslint-plugin';
import parserTs from '@typescript-eslint/parser';
import pluginImportX from 'eslint-plugin-import-x';
import pluginPromise from 'eslint-plugin-promise';
import configPrettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: parserTs,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    plugins: {
      '@typescript-eslint': pluginTs,
      'import-x': pluginImportX,
      promise: pluginPromise,
    },
    rules: {
      ...pluginTs.configs.recommended.rules,
      'no-var': 'error',
      'prefer-const': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'import-x/no-default-export': 'error',
      'promise/prefer-await-to-then': 'error',
      'promise/prefer-await-to-callbacks': 'error',
    },
  },
  configPrettier,
];
