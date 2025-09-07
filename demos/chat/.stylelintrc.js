export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recommended'
  ],
  rules: {
    // === PROHIBIT ALL CUSTOM CSS ===
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'variants',
          'responsive',
          'screen'
        ]
      }
    ],
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global']
      }
    ],
    'selector-pseudo-element-no-unknown': [
      true,
      {
        ignorePseudoElements: ['global']
      }
    ],
    'property-no-unknown': [
      true,
      {
        ignoreProperties: [
          'composes',
          'compose-with'
        ]
      }
    ],
    
    // === ENFORCE VUETIFY USAGE ===
    'declaration-no-important': 'error',
    'selector-class-pattern': [
      '^v-[a-z-]+$|^[a-z-]+-[0-9]+$|^text-[a-z-]+$|^bg-[a-z-]+$|^border-[a-z-]+$|^rounded-[a-z-]+$|^p-[0-9]+$|^m-[0-9]+$|^pa-[0-9]+$|^ma-[0-9]+$|^d-[a-z-]+$|^flex-[a-z-]+$|^align-[a-z-]+$|^justify-[a-z-]+$|^gap-[0-9]+$|^w-[0-9]+$|^h-[0-9]+$',
      {
        message: 'Only Vuetify utility classes are allowed. Custom CSS classes are prohibited.'
      }
    ],
    
    // === PREVENT CUSTOM STYLING ===
    'custom-property-pattern': [
      '^v-[a-z-]+$',
      {
        message: 'Custom CSS properties are not allowed. Use Vuetify design tokens.'
      }
    ],
    
    // === STRICT RULES ===
    'color-no-invalid-hex': 'error',
    'font-family-no-duplicate-names': 'error',
    'font-family-no-missing-generic-family-keyword': 'error',
    'function-calc-no-unspaced-operator': 'error',
    'function-linear-gradient-no-nonstandard-direction': 'error',
    'string-no-newline': 'error',
    'unit-no-unknown': 'error',
    'keyframe-declaration-no-important': 'error',
    'declaration-block-no-duplicate-properties': 'error',
    'declaration-block-no-shorthand-property-overrides': 'error',
    'block-no-empty': 'error',
    'selector-pseudo-element-colon-notation': 'double',
    'selector-type-case': 'lower',
    'selector-type-no-unknown': 'error',
    'selector-max-empty-lines': 0,
    'rule-empty-line-before': [
      'always-multi-line',
      {
        except: ['first-nested'],
        ignore: ['after-comment']
      }
    ],
    'at-rule-empty-line-before': [
      'always',
      {
        except: ['blockless-after-same-name-blockless', 'first-nested'],
        ignore: ['after-comment']
      }
    ],
    'comment-empty-line-before': [
      'always',
      {
        except: ['first-nested'],
        ignore: ['stylelint-commands']
      }
    ],
    'max-empty-lines': 2,
    'no-duplicate-selectors': 'error',
    'no-empty-source': 'error',
    'no-extra-semicolons': 'error',
    'no-invalid-double-slash-comments': 'error'
  },
  ignoreFiles: [
    'node_modules/**/*',
    'dist/**/*',
    'build/**/*',
    'coverage/**/*'
  ]
};
