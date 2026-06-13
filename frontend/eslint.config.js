// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',

      // React 17+ JSX transform
      'react/react-in-jsx-scope': 'off',

      // Unused vars => warning
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-unused-vars': 'off',

      // Type-only imports => warning
      '@typescript-eslint/consistent-type-imports': 'warn',
    },
  },
  {
    ignores: ['eslint.config.js', 'prettier.config.js'],
  },
]
