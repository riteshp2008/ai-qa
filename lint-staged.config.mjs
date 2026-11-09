/**
 * Runs on `git commit` for staged files only (see .husky/pre-commit).
 * Type checking needs the whole program, so it runs once regardless of which
 * TypeScript files changed (the function form prevents file args being appended).
 */
const config = {
  "*.{js,mjs,cjs,jsx,ts,tsx}": "eslint --max-warnings=0 --fix",
  "*.{ts,tsx}": () => "npm run typecheck",
};

export default config;
