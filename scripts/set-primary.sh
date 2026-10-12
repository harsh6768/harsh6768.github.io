#!/usr/bin/env bash
# Make one hosted style the primary site at the root.
# Usage: scripts/set-primary.sh <clay|glass|collage|planets>
set -euo pipefail

cd "$(dirname "$0")/.."
name="${1:?usage: scripts/set-primary.sh <style>}"
dir="styles/$name"

if [ ! -f "$dir/index.html" ]; then
  echo "No style named '$name' in styles/ (available: $(ls styles | grep -v index.html | tr '\n' ' '))" >&2
  exit 1
fi

for f in index.html styles.css main.js; do
  cp "$dir/$f" "$f"
done

# Variant files import ../../data.js; the root needs ./data.js
sed -i.bak "s#from '../../data.js'#from './data.js'#" main.js
rm -f main.js.bak

echo "Primary style is now '$name'. Review with git diff, then commit."
