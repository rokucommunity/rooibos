module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    env: {
        node: true,
        mocha: true,
        es6: true
    },
    parserOptions: {
        project: ['./tsconfig.json'],
        createDefaultProgram: true
    },
    plugins: [
        '@typescript-eslint',
        'import',
        'no-only-tests',
        'jsdoc',
        'import'
    ],
    extends: [
        'eslint:all',
        'plugin:@typescript-eslint/all',
        'plugin:jsdoc/recommended',
        'plugin:import/typescript'
    ],
    settings: {
        'import/resolver': {
            typescript: true,
            node: true
        }
    },
    rules: {
        '@typescript-eslint/array-type': 'off',
        '@typescript-eslint/consistent-type-assertions': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/init-declarations': 'off',
        '@typescript-eslint/parameter-properties': 'off',
        '@typescript-eslint/lines-between-class-members': 'off',
        '@typescript-eslint/member-ordering': 'off',
        '@typescript-eslint/method-signature-style': 'off',
        '@typescript-eslint/naming-convention': 'off',
        '@typescript-eslint/no-base-to-string': 'off',
        '@typescript-eslint/no-confusing-void-expression': 'off',
        '@typescript-eslint/no-dynamic-delete': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-extra-parens': 'off',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-implicit-any-catch': 'off',
        '@typescript-eslint/no-invalid-this': 'off',
        '@typescript-eslint/no-magic-numbers': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-parameter-properties': 'off',
        //had to add this rule to prevent eslint from crashing
        '@typescript-eslint/no-restricted-imports': ['off', {}],
        //mitigating this sometimes results in undesirably verbose code. Should investigate enabling again in the future.
        '@typescript-eslint/no-unsafe-argument': 'off',
        'object-curly-spacing': 'off',
        '@typescript-eslint/object-curly-spacing': [
            'error',
            'always'
        ],
        '@typescript-eslint/no-shadow': 'off',
        '@typescript-eslint/no-this-alias': 'off',
        '@typescript-eslint/no-invalid-void': 'off',
        '@typescript-eslint/no-invalid-void-type': 'off',
        '@typescript-eslint/no-type-alias': 'off',
        '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
        '@typescript-eslint/no-unnecessary-condition': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars-experimental': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/prefer-readonly': 'off',
        '@typescript-eslint/prefer-readonly-parameter-types': 'off',
        '@typescript-eslint/promise-function-async': 'off',
        '@typescript-eslint/quotes': [
            'error',
            'single',
            {
                'allowTemplateLiterals': true
            }
        ],
        '@typescript-eslint/require-array-sort-compare': 'off',
        '@typescript-eslint/restrict-plus-operands': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/sort-type-union-intersection-members': 'off',
        '@typescript-eslint/space-before-function-paren': 'off',
        '@typescript-eslint/space-infix-ops': 'off',
        '@typescript-eslint/strict-boolean-expressions': 'off',
        '@typescript-eslint/typedef': 'off',
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/unified-signatures': 'off',
        'jsdoc/require-param': 'off',
        'jsdoc/require-returns': 'off',
        'jsdoc/require-param-type': 'off',
        'jsdoc/newline-after-description': 'off',
        'jsdoc/require-jsdoc': 'off',
        'jsdoc/require-returns-type': 'off',
        'array-bracket-newline': 'off',
        'array-element-newline': 'off',
        'array-type': 'off',
        'arrow-body-style': 'off',
        'arrow-parens': 'off',
        'callback-return': 'off',
        'capitalized-comments': 'off',
        'class-methods-use-this': 'off',
        'complexity': 'off',
        'consistent-return': 'off',
        'consistent-this': 'off',
        'curly': 'error',
        'default-case': 'off',
        'dot-location': 'off',
        'dot-notation': 'off',
        'func-style': 'off',
        'function-call-argument-newline': 'off',
        'function-paren-newline': 'off',
        'getter-return': 'off',
        'guard-for-in': 'off',
        'id-length': 'off',
        'import/no-duplicates': 'error',
        'import/no-extraneous-dependencies': ['error', {
            'devDependencies': ['**/*.spec.ts']
        }],
        'indent': 'off',
        'init-declarations': 'off',
        'line-comment-position': 'off',
        'linebreak-style': 'off',
        'lines-around-comment': 'off',
        'lines-between-class-members': 'off',
        'max-classes-per-file': 'off',
        'max-depth': 'off',
        'max-len': 'off',
        'max-lines': 'off',
        'max-lines-per-function': 'off',
        'max-params': 'off',
        'max-statements': 'off',
        'no-only-tests/no-only-tests': 'error',
        'multiline-comment-style': 'off',
        'multiline-ternary': 'off',
        'new-cap': 'off',
        'newline-per-chained-call': 'off',
        'no-await-in-loop': 'off',
        'no-case-declarations': 'off',
        'no-console': 'off',
        'no-constant-condition': 'off',
        'no-continue': 'off',
        'no-duplicate-imports': 'off',
        'no-else-return': 'off',
        'no-empty': 'off',
        'no-implicit-coercion': 'off',
        'no-inline-comments': 'off',
        'no-invalid-this': 'off',
        'no-labels': 'off',
        'no-lonely-if': 'off',
        'no-negated-condition': 'off',
        'no-param-reassign': 'off',
        'no-plusplus': 'off',
        'no-process-exit': 'off',
        'no-prototype-builtins': 'off',
        'no-shadow': 'off',
        'no-sync': 'off',
        'no-ternary': 'off',
        'no-undefined': 'off',
        'no-underscore-dangle': 'off',
        'no-unneeded-ternary': 'off',
        'no-useless-escape': 'off',
        'no-void': 'off',
        'no-warning-comments': 'off',
        'object-property-newline': 'off',
        'object-shorthand': [
            'error',
            'never'
        ],
        'one-var': [
            'error',
            'never'
        ],
        'padded-blocks': 'off',
        'prefer-const': 'off',
        'prefer-destructuring': 'off',
        'prefer-named-capture-group': 'off',
        'prefer-template': 'off',
        'quote-props': 'off',
        'radix': 'off',
        'require-atomic-updates': 'off',
        'require-unicode-regexp': 'off',
        'sort-imports': 'off',
        'sort-keys': 'off',
        'spaced-comment': 'off',
        'space-infix-ops': 'off',
        'vars-on-top': 'off',
        'wrap-regex': 'off'
    },
    //disable some rules for certain files
    overrides: [{
        //these files are getting deleted soon, so ingore the eslint warnings for now
        files: ['src/brsTypes/**/*.ts'],
        rules: {
            '@typescript-eslint/no-invalid-this': 'off',
            '@typescript-eslint/method-signature-style': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/prefer-enum-initializers': 'off'
        }
    },
    {
        files: ['*.spec.ts'],
        rules: {
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars-experimental': 'off',
            '@typescript-eslint/dot-notation': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            'import/no-extraneous-dependencies': 'off',
            'func-names': 'off',
            'new-cap': 'off',
            'no-shadow': 'off',
            'no-void': 'off'
        }
    }, {
        files: ['benchmarks/**/*'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-var-requires': 'off'
        }
    }, {
        files: ['src/roku-types/data.json'],
        rules: {
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/quotes': 'off',
            'no-template-curly-in-string': 'off',
            'eol-last': 'off',
            '@typescript-eslint/semi': 'off'
        }
    },
    {
        files: ['scripts/**/*.ts'],
        rules: {
            '@typescript-eslint/no-var-requires': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            'camelcase': 'off'
        }
    },
    {
        files: ['benchmarks/**/*.ts'],
        rules: {
            '@typescript-eslint/dot-notation': 'off',
            '@typescript-eslint/no-unnecessary-type-assertion': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            'no-var': 'off',
            'camelcase': 'off'
        }
    }]
};
