import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import vue from 'eslint-plugin-vue';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'vue': vue,
    },
    rules: {
      // === STRICT TYPE SAFETY RULES ===
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', {
        assertionStyle: 'never' // Disable type assertions completely
      }],
      
      // === PREVENT TYPE CASTING ===
      '@typescript-eslint/ban-ts-comment': ['error', {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': true,
        'ts-nocheck': true,
        'ts-check': false,
        minimumDescriptionLength: 10
      }],
      
      // === VUETIFY STRICT STYLING RULES ===
      'no-restricted-syntax': [
        'error',
        // Inline CSS restrictions
        {
          selector: 'CallExpression[callee.property.name="setProperty"]',
          message: 'Inline CSS styles are not allowed. Use Vuetify classes instead.'
        },
        {
          selector: 'AssignmentExpression[left.property.name="style"]',
          message: 'Inline CSS styles are not allowed. Use Vuetify classes instead.'
        },
        {
          selector: 'MemberExpression[object.property.name="style"]',
          message: 'Direct style manipulation is not allowed. Use Vuetify classes instead.'
        },
        {
          selector: 'CallExpression[callee.property.name="setAttribute"][arguments.0.value="style"]',
          message: 'Inline CSS styles via setAttribute are not allowed. Use Vuetify classes instead.'
        },
        {
          selector: 'CallExpression[callee.property.name="setAttribute"][arguments.0.value="class"]',
          message: 'Dynamic class manipulation should use Vuetify classes. Avoid custom CSS classes.'
        },
        // Template literal restrictions
        {
          selector: 'TemplateLiteral[quasis.0.value.raw*="style="]',
          message: 'Inline CSS in template literals is not allowed. Use Vuetify classes.'
        },
        {
          selector: 'TemplateLiteral[quasis.0.value.raw*="class="]',
          message: 'Custom CSS classes in template literals are not allowed. Use Vuetify classes.'
        },
        // DOM manipulation restrictions
        {
          selector: 'CallExpression[callee.name="createElement"][arguments.0.value="style"]',
          message: 'Creating style elements is not allowed. Use Vuetify components.'
        },
        // Vuetify-specific restrictions
        {
          selector: 'CallExpression[callee.name="createElement"][arguments.0.value="div"][arguments.1.properties.0.key.name="style"]',
          message: 'Creating div elements with inline styles is not allowed. Use Vuetify components.'
        },
        {
          selector: 'JSXAttribute[name.name="style"]',
          message: 'JSX style attributes are not allowed. Use Vuetify classes.'
        },
        {
          selector: 'JSXAttribute[name.name="className"][value.value*="custom-"]',
          message: 'Custom CSS classes in JSX are not allowed. Use Vuetify classes.'
        }
      ],
      
      // === IMPORT RESTRICTIONS ===
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*.css', '*.scss', '*.sass', '*.less'],
              message: 'Custom CSS imports are not allowed. Use Vuetify styling system.'
            },
            {
              group: ['styled-components', 'emotion', '@emotion/*'],
              message: 'CSS-in-JS libraries are not allowed. Use Vuetify styling system.'
            }
          ]
        }
      ],
      
      // === ENFORCE TYPE SAFETY ===
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',
      
      // === ENFORCE PROPER TYPING ===
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': ['error', { 
        prefer: 'type-imports',
        disallowTypeAnnotations: false
      }],
      '@typescript-eslint/consistent-type-exports': ['error', { 
        fixMixedExportsWithInlineTypeSpecifier: false 
      }],
      
      // === PREVENT BAD PATTERNS ===
      '@typescript-eslint/no-base-to-string': 'error',
      '@typescript-eslint/no-confusing-void-expression': 'error',
      '@typescript-eslint/no-meaningless-void-operator': 'error',
      '@typescript-eslint/no-mixed-enums': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/no-unnecessary-type-arguments': 'error',
      '@typescript-eslint/no-useless-empty-export': 'error',
      '@typescript-eslint/prefer-enum-initializers': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-literal-enum-member': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/restrict-plus-operands': 'error',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/unbound-method': 'error',
      
      
      // === DEMO-SPECIFIC RULES ===
      'no-console': 'warn', // Allow console in demo code
    },
  },
  {
    // Vue files - strict Vue and Vuetify rules
    files: ['**/*.vue'],
    languageOptions: {
      parser: vue.parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        parser: typescriptParser,
      },
    },
    plugins: {
      'vue': vue,
      '@typescript-eslint': typescript,
    },
    rules: {
      ...vue.configs['vue3-recommended'].rules,
      ...vue.configs['vue3-essential'].rules,
      
      // === VUETIFY STRICT RULES ===
      'vue/no-v-html': 'error', // Prevent XSS vulnerabilities
      'vue/require-v-for-key': 'error',
      'vue/require-prop-types': 'error',
      'vue/require-default-prop': 'error',
      'vue/no-unused-vars': 'error',
      'vue/no-unused-components': 'error',
      'vue/no-mutating-props': 'error',
      'vue/no-side-effects-in-computed-properties': 'error',
      'vue/return-in-computed-property': 'error',
      'vue/no-async-in-computed-properties': 'error',
      'vue/no-dupe-keys': 'error',
      'vue/no-duplicate-attributes': 'error',
      'vue/no-parsing-error': 'error',
      'vue/no-reserved-keys': 'error',
      'vue/no-shared-component-data': 'error',
      'vue/no-template-key': 'error',
      'vue/no-textarea-mustache': 'error',
      'vue/no-use-v-if-with-v-for': 'error',
      'vue/require-component-is': 'error',
      'vue/require-render-return': 'error',
      'vue/require-valid-default-prop': 'error',
      'vue/use-v-on-exact': 'error',
      'vue/valid-template-root': 'error',
      'vue/valid-v-bind': 'error',
      'vue/valid-v-cloak': 'error',
      'vue/valid-v-else-if': 'error',
      'vue/valid-v-else': 'error',
      'vue/valid-v-for': 'error',
      'vue/valid-v-html': 'error',
      'vue/valid-v-if': 'error',
      'vue/valid-v-model': 'error',
      'vue/valid-v-on': 'error',
      'vue/valid-v-once': 'error',
      'vue/valid-v-pre': 'error',
      'vue/valid-v-show': 'error',
      'vue/valid-v-text': 'error',
      
      // === STRICT TYPE SAFETY FOR VUE ===
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', {
        assertionStyle: 'never'
      }],
    },
  },
  {
    // HTML files - prevent inline styles
    files: ['**/*.html'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Attribute[name="style"]',
          message: 'Inline CSS styles are not allowed. Use Vuetify classes instead.'
        },
        {
          selector: 'Attribute[name="class"][value*="custom-"]',
          message: 'Custom CSS classes are not allowed. Use Vuetify utility classes.'
        }
      ]
    }
  },
  {
    // CSS files - prevent custom CSS entirely
    files: ['**/*.css', '**/*.scss', '**/*.sass', '**/*.less'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: '*',
          message: 'Custom CSS files are not allowed. Use Vuetify styling system.'
        }
      ]
    }
  }
];
