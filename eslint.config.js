import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
    // JavaScript向けの基本設定
    js.configs.recommended,

    // TypeScript向けの設定（要 type-check）
    ...tseslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,

    // Prettier互換設定
    {
        rules: {
            ...prettier.rules,
        },
    },

    // プロジェクト固有の設定
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: './tsconfig.json',
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        linterOptions: {
            reportUnusedDisableDirectives: true,
        },
        rules: {
            'no-case-declarations': 'off',
        },
        ignores: [
            'node_modules/**/**.js',
            'node_modules/**/**.ts',
            'dist/**/**.js',
            'vite.config.ts',
            'libs/**/**.js',
            'packer/**/**.js',
            'node-libs/**/**.ts',
            'bin/**/**.js',
            'marionetter-server/index.js',
            'demos/**/**.js',
        ],
    },
];
