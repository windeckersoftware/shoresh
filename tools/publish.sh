#!/usr/bin/env bash
# Publish out/Shoresh-<version>.apk as a GitHub Release asset and point the
# download page at it. APKs never go into the Pages repo itself: each one is
# ~66 MB and Pages sites are capped at 1 GB.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="$ROOT/site"
REPO="windeckersoftware/windeckersoftware.github.io"

VERSION="$(sed -n 's/.*android:versionName="\([^"]*\)".*/\1/p' "$ROOT/app/AndroidManifest.xml")"
APK="$ROOT/out/Shoresh-$VERSION.apk"
TAG="shoresh-$VERSION"
NOTES="${1:?usage: tools/publish.sh \"one-line release note\"}"
[ -f "$APK" ] || { echo "missing $APK — run ./build.sh first" >&2; exit 1; }

SHA="$(shasum -a 256 "$APK" | cut -d' ' -f1)"
BYTES="$(stat -f%z "$APK")"
MB=$(( (BYTES + 524288) / 1048576 ))
URL="https://github.com/$REPO/releases/download/$TAG/Shoresh-$VERSION.apk"

echo "== release $TAG ($MB MB) =="
if gh release view "$TAG" -R "$REPO" >/dev/null 2>&1; then
  if ! curl -fsSL "$URL" | shasum -a 256 | grep -q "^$SHA"; then
    gh release upload "$TAG" "$APK" -R "$REPO" --clobber
  fi
else
  gh release create "$TAG" "$APK" -R "$REPO" --latest --title "Shoresh $VERSION" \
    --notes "$NOTES"$'\n\n'"Android 8 and newer. SHA-256: \`$SHA\`"
fi

echo "== verify hosted checksum =="
HOSTED="$(curl -fsSL "$URL" | shasum -a 256 | cut -d' ' -f1)"
[ "$HOSTED" = "$SHA" ] || { echo "hosted SHA $HOSTED != local $SHA" >&2; exit 1; }

echo "== site =="
git -C "$SITE" fetch -q
git -C "$SITE" rebase -q --autostash origin/main
sed -i '' -E \
  -e "s#href=\"[^\"]*Shoresh-[0-9.]+\.apk\"( download)?#href=\"$URL\"#" \
  -e "s#Version [0-9.]+ · Android 8 and newer · about [0-9]+ MB#Version $VERSION · Android 8 and newer · about $MB MB#" \
  -e "s#(File check, optional: <code>)[0-9a-f]{64}#\\1$SHA#" \
  "$SITE/ner/index.html"
git -C "$SITE" add ner/
if git -C "$SITE" diff --cached --quiet; then
  echo "site already points at $VERSION"
else
  git -C "$SITE" commit -q -m "Publish Shoresh $VERSION" -m "$NOTES" ${PUBLISH_TRAILER:+-m "$PUBLISH_TRAILER"}
  git -C "$SITE" push -q origin main
fi
echo "$URL"
echo "SHA-256 $SHA"
