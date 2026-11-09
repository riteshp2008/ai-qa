/** Conventional commits, e.g. `feat(onboarding): add join requests`. */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [0],
    "body-max-line-length": [1, "always", 120],
  },
};

export default config;
