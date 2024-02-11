module.exports = {
  extends: [
    'eslint:recommended',
    'airbnb',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'jest', 'vue'],
  settings: {
    'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    jest: {
      version: 27,
    },
  },
  parserOptions: {
    ecmaVersion: 2021,
    createDefaultProgram: false,
    project: ['./tsconfig.json', './**/tsconfig.json'],
  },
  rules: {
    "camelcase": "off",
    "no-restricted-syntax": "off",
    "class-methods-use-this": "off",
    "no-shadow": "off",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "error",
    'linebreak-style': 0,
    "import/no-extraneous-dependencies":[
      "error",
      {
        "devDependencies":[
          "**/*.test.ts",
          "**/*.test.tsx",
          "**/*.spec.js",
          "**/*.spec.jsx",
          "**/*.spec.jsx",
          "**/*jest.config.ts",
          "**/*jest.config.js",
        ]
      }
    ],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'no-use-before-define': 'off',
    'no-console': 'off',
    'import/no-dynamic-require': 'off',
    'max-len': ['error', {
      code: 120,
      ignorePattern: 'true',
      ignoreComments: true,
      ignoreTrailingComments: true,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreRegExpLiterals: true,
    }],
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-param-reassign': 'off',
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
    '@typescript-eslint/naming-convention': 'off',
    'eslint/space-before-blocks': 'off',
    '@typescript-eslint/space-before-blocks': 'off',
    'no-underscore-dangle': 'off',
    'import/prefer-default-export': 'off',
    'global-require': 'off',
  },
  env: {
    'jest/globals': true,
  },
};
