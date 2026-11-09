#!/bin/sh
# Blocks commits that stage local env files or obvious private keys.
blocked=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '(^|/)\.env(\..+)?$' | grep -v -E '\.env\.example$')
if [ -n "$blocked" ]; then
  echo "✖ Refusing to commit environment files:" >&2
  echo "$blocked" | sed 's/^/  - /' >&2
  echo "  Unstage them with: git restore --staged <file>" >&2
  exit 1
fi

if git diff --cached -U0 --diff-filter=ACMR | grep -E '^\+' | grep -q -E 'BEGIN (RSA|EC|OPENSSH|PRIVATE) (PRIVATE )?KEY'; then
  echo "✖ A private key appears in the staged changes." >&2
  exit 1
fi
