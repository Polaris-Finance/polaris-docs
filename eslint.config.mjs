import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default [
  {
    ignores: [
      '.next/**',
      'out/**',
      'node_modules/**',
      'public/**',
      'content/**',
      'agents/**',
      '.github/skills/**',
      '.playwright/**',
      '.playwright-cli/**',
      '.playwright-mcp/**',
      'playwright-report/**',
      'test-results/**'
    ]
  },
  {
    files: [
      'app/**/*.{js,jsx,mjs}',
      'components/**/*.{js,jsx}',
      'scripts/**/*.mjs',
      'tests/**/*.{js,mjs}',
      '*.config.mjs'
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'no-console': 'off',
      'react/prop-types': 'off'
    }
  }
]
