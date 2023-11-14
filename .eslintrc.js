module.exports = {
  env: {
    browser: true,
    commonjs: false,
    es2021: true,
    node: true,
    jquery: true,
  },
  globals: {
    tools: true,
    Paint: true,
  },
  extends: "eslint:recommended",
  overrides: [
    {
      env: {
        node: true,
      },
      files: [".eslintrc.{js,cjs}"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {},
};
