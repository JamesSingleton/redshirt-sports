import sanityStudio from '@sanity/eslint-config-studio'
import eslintPluginImport from 'eslint-plugin-import'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import eslintPluginSimpleImportSort from 'eslint-plugin-simple-import-sort'
import tseslint from 'typescript-eslint'

/** @type {import('eslint').Linter.Config} */

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '.sanity/**', 'functions/**/.build/**'],
  },
  ...sanityStudio,
  {
    plugins: {
      prettier: eslintPluginPrettier,
      'simple-import-sort': eslintPluginSimpleImportSort,
      import: eslintPluginImport,
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'prettier/prettier': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/no-default-export': 'off',
    },
  },
]
