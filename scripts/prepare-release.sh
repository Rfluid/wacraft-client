#!/usr/bin/env bash
# prepare-release.sh — bump package.json to the next patch version
# (latest GitHub release + 1 on the patch component) and refresh
# package-lock.json.
#
# Usage:
#   ./scripts/prepare-release.sh                    # latest release + patch bump
#   ./scripts/prepare-release.sh --tag v0.3.0       # bump from this tag instead
#   ./scripts/prepare-release.sh --repo owner/name  # override repo
#
# Defaults:
#   repo = Astervia/wacraft-client
#   tag  = latest published release (GET /repos/:repo/releases/latest)
#
# Example: latest release is v0.2.18 -> package.json becomes 0.2.19
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'

REPO="Astervia/wacraft-client"
TAG=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --repo) REPO="$2"; shift 2 ;;
        --tag)  TAG="$2";  shift 2 ;;
        -h|--help)
            sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
            exit 0
            ;;
        *)
            echo -e "${RED}unknown argument: $1${RESET}" >&2
            exit 2
            ;;
    esac
done

command -v node >/dev/null || { echo -e "${RED}node is required${RESET}" >&2; exit 1; }
command -v npm  >/dev/null || { echo -e "${RED}npm is required${RESET}"  >&2; exit 1; }

# ── fetch latest tag ─────────────────────────────────────────────────────────
fetch_latest_tag() {
    local url="https://api.github.com/repos/${REPO}/releases/latest"
    local headers=(-H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28")
    [[ -n "${GITHUB_TOKEN:-}" ]] && headers+=(-H "Authorization: Bearer ${GITHUB_TOKEN}")

    if command -v gh >/dev/null; then
        gh api "repos/${REPO}/releases/latest" --jq .tag_name 2>/dev/null && return 0
    fi

    if command -v curl >/dev/null; then
        curl -fsSL "${headers[@]}" "$url" \
            | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).tag_name||"")}catch{process.exit(1)}})'
        return $?
    fi

    echo -e "${RED}neither gh nor curl is available to query GitHub${RESET}" >&2
    return 1
}

if [[ -z "$TAG" ]]; then
    echo -e "${CYAN}${BOLD}── fetching latest release from ${REPO} ──${RESET}"
    TAG="$(fetch_latest_tag)"
    if [[ -z "$TAG" ]]; then
        echo -e "${RED}failed to resolve latest release tag${RESET}" >&2
        exit 1
    fi
fi

BASE="${TAG#v}"
echo -e "  ${DIM}latest tag:${RESET}    $TAG"

if ! [[ "$BASE" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    echo -e "${RED}'$BASE' is not a plain MAJOR.MINOR.PATCH — refusing to bump${RESET}" >&2
    exit 1
fi

MAJOR="${BASH_REMATCH[1]}"
MINOR="${BASH_REMATCH[2]}"
PATCH="${BASH_REMATCH[3]}"
VERSION="${MAJOR}.${MINOR}.$((PATCH + 1))"

echo -e "  ${DIM}next version:${RESET}  $VERSION"

# ── patch package.json ───────────────────────────────────────────────────────
echo -e "\n${CYAN}${BOLD}── patching package.json ──${RESET}"
CURRENT="$(node -p "require('./package.json').version")"
echo -e "  ${DIM}current:${RESET} $CURRENT"

if [[ "$CURRENT" == "$VERSION" ]]; then
    echo -e "  ${YELLOW}package.json already at $VERSION — skipping rewrite${RESET}"
else
    node - "$VERSION" <<'NODE'
const fs = require('fs');
const path = './package.json';
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
pkg.version = process.argv[2];
fs.writeFileSync(path, JSON.stringify(pkg, null, 4) + '\n');
NODE
    echo -e "  ${GREEN}package.json -> $VERSION${RESET}"
fi

# ── refresh package-lock.json ────────────────────────────────────────────────
echo -e "\n${CYAN}${BOLD}── updating package-lock.json ──${RESET}"
npm install --package-lock-only

echo -e "\n${GREEN}${BOLD}done — review the diff and commit.${RESET}"
