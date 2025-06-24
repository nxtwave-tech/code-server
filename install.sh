#!/bin/sh
set -eu

# -----------------------------
# Configuration & Defaults
# -----------------------------
VERSION="${VERSION:-1.0.0}"
STANDALONE_INSTALL_PREFIX="${STANDALONE_INSTALL_PREFIX:-$HOME/.local}"
CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/code-server"
BIN_DIR="$STANDALONE_INSTALL_PREFIX/bin"
LIB_DIR="$STANDALONE_INSTALL_PREFIX/lib"

# Detect OS and Architecture
OS="$(uname | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64) ARCH="amd64" ;;
  aarch64 | arm64) ARCH="arm64" ;;
  *) echo "❌ Unsupported architecture: $ARCH" >&2; exit 1 ;;
esac

TAR_NAME="code-server-$VERSION-$OS-$ARCH.tar.gz"
TAR_URL="https://github.com/lavanyaburlagadda1807/code-server-poc/releases/download/v$VERSION/$TAR_NAME"
TAR_PATH="$CACHE_DIR/$TAR_NAME"

# -----------------------------
# Download and Extract
# -----------------------------
echo "📦 Installing code-server v$VERSION for $OS/$ARCH..."
mkdir -p "$CACHE_DIR" "$BIN_DIR" "$LIB_DIR"

if [ ! -f "$TAR_PATH" ]; then
  echo "⬇️  Downloading $TAR_URL"
  curl -#fL "$TAR_URL" -o "$TAR_PATH"
else
  echo "✅ Using cached archive: $TAR_PATH"
fi

# Extract and move to lib
EXTRACTED_DIR="$LIB_DIR/code-server-$VERSION-$OS-$ARCH"
FINAL_DIR="$LIB_DIR/code-server-$VERSION"

tar -xzf "$TAR_PATH" -C "$LIB_DIR"

if [ ! -d "$FINAL_DIR" ]; then
  mv "$EXTRACTED_DIR" "$FINAL_DIR"
fi

# Symlink binary
ln -sf "$FINAL_DIR/bin/code-server" "$BIN_DIR/code-server"

# -----------------------------
# Post-install Message
# -----------------------------
echo ""
echo "✅ code-server installed at: $FINAL_DIR"
echo "➡️  Add this to your shell config:"
echo "    export PATH=\"$BIN_DIR:\$PATH\""
echo "➡️  Then run:"
echo "    code-server"
