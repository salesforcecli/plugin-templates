import tsconfigs from 'eslint-config-salesforce-typescript';
import plugin from 'eslint-plugin-sf-plugin';

const configs = [
  ...tsconfigs,
  ...plugin.configs.recommended,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/ban-ts-ignore': 'off',
      '@typescript-eslint/camelcase': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'jsdoc/no-types': 'warn',
      'ban-ts-ignore': 'off',
      camelcase: 'off',
      'constructor-super': 'warn',
      'no-buffer-constructor': 'error',
      'no-caller': 'error',
      'no-debugger': 'warn',
      'no-duplicate-case': 'error',
      'no-duplicate-imports': 'error',
      'no-eval': 'error',
      'no-extra-semi': 'warn',
      'no-redeclare': 'error',
      'no-sparse-arrays': 'error',
      'no-throw-literal': 'error',
      'no-unsafe-finally': 'warn',
      'no-unused-labels': 'warn',
      'no-restricted-globals': ['warn', 'name', 'length', 'event', 'closed', 'external', 'status', 'origin', 'context'], // non-complete list of globals that are easy to access unintentionally.
      'no-var': 'error',
      'no-unused-vars': 'off',
    },
  },
];

export default configs;
