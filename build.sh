#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
TC="$ROOT/.toolchain"
export JAVA_HOME="$TC/jdk-21.0.13+9/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
export ANDROID_HOME="$TC/sdk"
AAPT2="$ANDROID_HOME/build-tools/35.0.0/aapt2"
D8="$ANDROID_HOME/build-tools/35.0.0/d8"
ZIPALIGN="$ANDROID_HOME/build-tools/35.0.0/zipalign"
APKSIGNER="$ANDROID_HOME/build-tools/35.0.0/apksigner"
ANDROID_JAR="$ANDROID_HOME/platforms/android-35/android.jar"
TESS_JAR="$ROOT/app/libs/tesseract4android.jar"
BUILD="$ROOT/build"
OUT="$ROOT/out"
rm -rf "$BUILD/classes" "$BUILD/gen" "$BUILD/dex" "$BUILD/res.zip" "$BUILD/app-unsigned.apk" "$BUILD/app-aligned.apk"
mkdir -p "$BUILD/classes" "$BUILD/gen" "$BUILD/dex" "$OUT"

echo "== packs =="
python3 "$ROOT/tools/update_packs.py"

echo "== resources =="
"$AAPT2" compile --dir "$ROOT/app/res" -o "$BUILD/res.zip"
"$AAPT2" link \
  -o "$BUILD/app-unsigned.apk" \
  -I "$ANDROID_JAR" \
  --manifest "$ROOT/app/AndroidManifest.xml" \
  -R "$BUILD/res.zip" \
  -A "$ROOT/app/assets" \
  --java "$BUILD/gen" \
  --auto-add-overlay \
  --min-sdk-version 26 \
  --target-sdk-version 35 \
  --version-code 119 \
  --version-name 1.6.2

echo "== java =="
find "$ROOT/app/src" -name '*.java' -print0 | xargs -0 "$JAVA_HOME/bin/javac" \
  -source 17 -target 17 -encoding UTF-8 \
  -classpath "$ANDROID_JAR:$TESS_JAR" -d "$BUILD/classes"
if [ -f "$BUILD/gen/app/ner/reader/R.java" ]; then
  "$JAVA_HOME/bin/javac" -source 17 -target 17 -encoding UTF-8 \
    -classpath "$ANDROID_JAR" -d "$BUILD/classes" "$BUILD/gen/app/ner/reader/R.java"
fi

echo "== dex =="
find "$BUILD/classes" -name '*.class' -print0 | xargs -0 "$D8" \
  --release --lib "$ANDROID_JAR" --min-api 26 --output "$BUILD/dex" "$TESS_JAR"
cp "$BUILD/app-unsigned.apk" "$BUILD/app-with-dex.apk"
( cd "$BUILD/dex" && zip -q -u "$BUILD/app-with-dex.apk" classes.dex )
# Tesseract native libraries (arm64 + 32-bit ARM)
mkdir -p "$BUILD/native/lib"
for abi in arm64-v8a armeabi-v7a; do
  if [ -d "$ROOT/.toolchain/ocr/aar/jni/$abi" ]; then
    mkdir -p "$BUILD/native/lib/$abi"
    cp "$ROOT/.toolchain/ocr/aar/jni/$abi/"*.so "$BUILD/native/lib/$abi/"
  fi
done
( cd "$BUILD/native" && zip -q -r -u "$BUILD/app-with-dex.apk" lib )

echo "== align =="
"$ZIPALIGN" -f -p 4 "$BUILD/app-with-dex.apk" "$BUILD/app-aligned.apk"

echo "== sign =="
KS="$ROOT/keystore/ner-dev.keystore"
if [ ! -f "$KS" ]; then
  mkdir -p "$ROOT/keystore"
  "$JAVA_HOME/bin/keytool" -genkeypair -v \
    -keystore "$KS" -alias ner -storepass nerdev -keypass nerdev \
    -dname "CN=Ner Reader, OU=Dev, O=Ner, L=Tel Aviv, C=IL" \
    -keyalg RSA -keysize 2048 -validity 10000 >/dev/null 2>&1
fi
"$APKSIGNER" sign --ks "$KS" --ks-key-alias ner --ks-pass pass:nerdev --key-pass pass:nerdev \
  --out "$OUT/Shoresh-1.6.2.apk" "$BUILD/app-aligned.apk"
"$APKSIGNER" verify --verbose "$OUT/Shoresh-1.6.2.apk" | head -8
ls -lh "$OUT/Shoresh-1.6.2.apk"
echo "APK: $OUT/Shoresh-1.6.2.apk"
