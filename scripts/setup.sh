#!/usr/bin/env bash
# ChurnSentry — one-command setup
#
# Usage:  ./scripts/setup.sh
#
# What it does:
#  1. Copies .env.example → .env (if missing)
#  2. Registers the two custom Coral sources (PostHog, Plain)
#  3. Registers the three bundled Coral sources (stripe, github, slack)
#  4. Installs npm dependencies
#
# Skips any step that's already done — safe to re-run.

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$here"

green() { printf "\033[32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }
red() { printf "\033[31m%s\033[0m\n" "$*"; }

if ! command -v coral >/dev/null 2>&1; then
  red "coral CLI not found. Install it first:"
  echo "  brew install withcoral/tap/coral"
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  green "✓ Created .env from .env.example — fill in your free API keys before running."
else
  yellow "• .env already exists — leaving it alone."
fi

green "→ Registering custom Coral source (PostHog)..."
coral source add ./coral-sources/posthog.yaml || yellow "• posthog source already registered or failed; check 'coral source list'."

green "→ Registering bundled Coral sources (Stripe, GitHub, Slack)..."
for src in stripe github slack; do
  if coral source list 2>/dev/null | grep -qi "^${src}\b"; then
    yellow "• ${src} source already registered."
  else
    coral source add --interactive "${src}" || yellow "• Skipped ${src} — run interactively later."
  fi
done

if [ -f package.json ] && [ ! -d node_modules ]; then
  green "→ Installing npm dependencies..."
  npm install
else
  yellow "• Node modules already installed (or no package.json)."
fi

green ""
green "ChurnSentry is set up. Next:"
echo "  1. Fill in your free API keys in .env (Groq, PostHog)"
echo "  2. Run: npm run demo"
echo "  3. Or live: npm run dev -- --customer-id cus_xxx --github-repo owner/repo"
