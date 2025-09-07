module.exports = {
  extends: ['../../.eslintrc.js'],
  env: {
    browser: true,
    node: true, // Chat demo has both client and server code
  },
  rules: {
    // Demo-specific rules
    'no-console': 'warn', // Allow console in demo code
    
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
    
    // === CSS AND STYLING RESTRICTIONS ===
    // Prevent inline styles in JavaScript/TypeScript
    'no-restricted-syntax': [
      'error',
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
      }
    ],
    
    // Prevent creation of style elements
    'no-restricted-globals': [
      'error',
      {
        name: 'document',
        message: 'Direct document manipulation for styling is not allowed. Use Vuetify components.'
      }
    ],
    
    // === STRING TEMPLATE RESTRICTIONS ===
    'no-restricted-syntax': [
      'error',
      {
        selector: 'TemplateLiteral[quasis.0.value.raw*="style="]',
        message: 'Inline CSS in template literals is not allowed. Use Vuetify classes.'
      },
      {
        selector: 'TemplateLiteral[quasis.0.value.raw*="class="]',
        message: 'Custom CSS classes in template literals are not allowed. Use Vuetify classes.'
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
          }
        ]
      }
    ],
    
    // === DOM MANIPULATION RESTRICTIONS ===
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.name="createElement"][arguments.0.value="style"]',
        message: 'Creating style elements is not allowed. Use Vuetify components.'
      },
      {
        selector: 'CallExpression[callee.name="createElement"][arguments.0.value="link"][arguments.1.properties.some(p=>p.key.name==="rel"&&p.value.value==="stylesheet")]',
        message: 'Creating stylesheet links is not allowed. Use Vuetify CSS framework.'
      }
    ],
    
    // === ENFORCE VUETIFY USAGE ===
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value*="v-"]',
        message: 'Vuetify directives should be used in templates, not in JavaScript strings.'
      }
    ],
    
    // === PREVENT CUSTOM CSS CLASSES ===
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/^[a-z-]+$/]',
        message: 'Custom CSS class names are not allowed. Use Vuetify utility classes.'
      }
    ],
    
    // === ENFORCE TYPE SAFETY ===
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',
    '@typescript-eslint/no-unnecessary-condition': 'error',
    '@typescript-eslint/no-unnecessary-type-constraint': 'error',
    
    // === PREVENT UNSAFE OPERATIONS ===
    '@typescript-eslint/no-unsafe-enum-comparison': 'error',
    '@typescript-eslint/no-unsafe-declaration-merging': 'error',
    '@typescript-eslint/no-unsafe-default-props': 'error',
    '@typescript-eslint/no-unsafe-destructuring': 'error',
    '@typescript-eslint/no-unsafe-references': 'error',
    
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
    '@typescript-eslint/use-unknown-in-catch-clause-variable': 'error'
  },
  overrides: [
    {
      // HTML files - prevent inline styles
      files: ['*.html'],
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
      files: ['*.css', '*.scss', '*.sass', '*.less'],
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
  ]
};

