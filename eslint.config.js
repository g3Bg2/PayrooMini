import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
    ...tseslint.configs.recommended, // TypeScript rules
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            react: reactPlugin,
            "react-hooks": reactHooks,
        },
        rules: {
            "react/react-in-jsx-scope": "off", // for React 17+
            "@typescript-eslint/no-explicit-any": "off",
        },
        settings: {
            react: {
                version: "detect",
            },
        },
    },
];
