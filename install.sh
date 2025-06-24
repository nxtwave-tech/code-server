#!/bin/sh
set -eu

usage() {
  cat << EOF
Installs code-server-poc using the standalone method only.

Usage:
  $0 [--version X.X.X] [--prefix <dir>] [--dry-run]

Options:
  --version X.X.X      Install a specific version (default: latest)
  --prefix <dir>       Installation prefix (default: ~/.local)
  --dry-run            Print commands without executing them
EOF
  exit 0
}

echoerr() {
  echo "$@" >&2
}

sh_c() {
  echo "+ $*"
  [ "${DRY_RUN:-}" ] || sh -c "$*"
}

fetch() {
  URL="$1"
  FILE="$2"

  if [ -e "$FILE" ]; then
    echo "+ Reusing $FILE"
    return
  fi

  mkdir -p "$CACHE_DIR"
  curl -#fL -o "$FILE.incomplete" -C - "$URL"
  mv "$FILE.incomplete" "$FILE"
}

get_latest_version() {
  curl -fsSLI -o /dev/null -w "%{url_effective}" \
    https://github.com/lavanyaburlagadda1807/code-server-poc/releases/latest |
    sed 's|.*/tag/v||'
}

ARCH=$(uname -m)
case "$ARCH" in
  x86_64) ARCH=amd64 ;;
  aarch64) ARCH=arm64 ;;
  *) echoerr "Unsupported architecture: $ARCH"; exit 1 ;;
esac

# Default values
STANDALONE_INSTALL_PREFIX=${HOME}/.local
VERSION=""
DRY_RUN=""

# Argument parsing
while [ $# -gt 0 ]; do
  case "$1" in
    --version)
      VERSION="$2"
      shift
      ;;
    --version=*)
      VERSION="${1#*=}"
      ;;
    --prefix)
      STANDALONE_INSTALL_PREFIX="$2"
      shift
      ;;
    --prefix=*)
      STANDALONE_INSTALL_PREFIX="${1#*=}"
      ;;
    --dry-run)
      DRY_RUN=1
      ;;
    -h|--help)
      usage
      ;;
    *)
      echoerr "Unknown argument: $1"
      usage
      ;;
  esac
  shift
done

VERSION="${VERSION:-$(get_latest_version)}"
CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/code-server-poc"

echo "Installing code-server-poc v$VERSION for $ARCH"
echo "Using prefix: $STANDALONE_INSTALL_PREFIX"

fetch "https://github.com/lavanyaburlagadda1807/code-server-poc/archive/refs/tags/v$VERSION.tar.gz" \
  "$CACHE_DIR/code-server-poc-$VERSION.tar.gz"

INSTALL_DIR="$STANDALONE_INSTALL_PREFIX/lib/code-server-poc-$VERSION"
BIN_DIR="$STANDALONE_INSTALL_PREFIX/bin"

if [ -e "$INSTALL_DIR" ]; then
  echo "Already installed at $INSTALL_DIR"
  echo "Remove it to reinstall."
  exit 0
fi

sh_c "mkdir -p '$INSTALL_DIR' '$BIN_DIR'"
sh_c "tar -C '$STANDALONE_INSTALL_PREFIX/lib' -xzf '$CACHE_DIR/code-server-poc-$VERSION.tar.gz'"
sh_c "mv '$STANDALONE_INSTALL_PREFIX/lib/code-server-poc-$VERSION' '$INSTALL_DIR'"
sh_c "ln -fs '$INSTALL_DIR/bin/code-server-poc' '$BIN_DIR/code-server-poc'"

echo
echo "Standalone install complete."
echo "Add this to your PATH if needed:"
echo "  export PATH=\"$BIN_DIR:\$PATH\""
echo "Run with:"
echo "  code-server-poc"
