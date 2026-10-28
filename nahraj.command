#!/bin/bash
# Nahra zmeny webu na GitHub. Cloudflare ich potom sam nasadi.
cd "$(dirname "$0")"
git add -A
git commit -m "${1:-Uprava webu}" || true
git push
echo
echo "Hotovo. Web sa nasadi o 1 - 2 minuty na https://defi-krypto.pages.dev"
