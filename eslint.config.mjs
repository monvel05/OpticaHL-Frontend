// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import angularEslint from "angular-eslint";

export default tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      ...angularEslint.configs.tsRecommended,
    ],
    processor: angularEslint.processInlineTemplates,
    rules: {
      "@angular-eslint/prefer-on-push-component-change-detection": "off",
      "@angular-eslint/prefer-inject": "off",
      "@angular-eslint/no-empty-lifecycle-method": "off",
      "@angular-eslint/component-class-suffix": [
        "error",
        {
          suffixes: ["Page", "Component"],
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angularEslint.configs.templateRecommended,
    ],
    rules: {},
  }
);