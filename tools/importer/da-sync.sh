#!/usr/bin/env bash
# Sync migrated content to Document Authoring, then preview + publish via admin.hlx.page.
# Credentials are injected automatically by the environment when the Adobe/DA opt-in
# is enabled — no Authorization header is set here (never paste tokens).
#
# Usage: tools/importer/da-sync.sh [--publish]
#   (no flag)   upload content to DA only
#   --publish   upload, then preview + publish every path
set -u

ORG="akshatn1"
SITE="eds-ema-training-capstone"
DA="https://admin.da.live/source/${ORG}/${SITE}"
HLX="https://admin.hlx.page"
CONTENT_DIR="content"
PUBLISH=0
[ "${1:-}" = "--publish" ] && PUBLISH=1

# Collect every migrated .plain.html except the vendored docs/ library and the
# duplicate us/en page (canonical home is index).
mapfile -t FILES < <(find "$CONTENT_DIR" -name '*.plain.html' \
  | grep -vE '/docs/|/us/en\.plain\.html$' | sort)

echo "Syncing ${#FILES[@]} documents to DA (${ORG}/${SITE})"
fail=0
for f in "${FILES[@]}"; do
  # content/foo/bar.plain.html -> DA path foo/bar.html ; index.plain.html -> index.html
  rel="${f#"$CONTENT_DIR"/}"
  daPath="${rel%.plain.html}.html"
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
    -F "data=@${f};type=text/html" --max-time 60 "${DA}/${daPath}")
  echo "  DA ${daPath} -> ${code}"
  [[ "$code" =~ ^2 ]] || fail=$((fail+1))
done

# nav + footer fragments live at the site root in DA
for frag in nav footer; do
  if [ -f "${CONTENT_DIR}/${frag}.plain.html" ]; then
    code=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
      -F "data=@${CONTENT_DIR}/${frag}.plain.html;type=text/html" --max-time 60 \
      "${DA}/${frag}.html")
    echo "  DA ${frag}.html -> ${code}"
    [[ "$code" =~ ^2 ]] || fail=$((fail+1))
  fi
done

echo "Upload complete (${fail} failures)."

if [ "$PUBLISH" -eq 1 ]; then
  echo "Previewing + publishing…"
  for f in "${FILES[@]}"; do
    rel="${f#"$CONTENT_DIR"/}"
    p="/${rel%.plain.html}"
    [ "$p" = "/index" ] && p="/"
    pc=$(curl -s -o /dev/null -w '%{http_code}' -X POST --max-time 60 "${HLX}/preview/${ORG}/${SITE}/main${p}")
    lc=$(curl -s -o /dev/null -w '%{http_code}' -X POST --max-time 60 "${HLX}/live/${ORG}/${SITE}/main${p}")
    echo "  ${p} preview:${pc} live:${lc}"
  done
fi
