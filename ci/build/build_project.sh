#!/bin/bash
quilt pop -a
# Exit immediately if a command exits with a non-zero status
set -e

# Check if version argument is provided
if [ -z "$1" ]; then
  echo "Error: Version argument is required"
  echo "Usage: $0 <version>"
  exit 1
fi

VERSION="$1"

# Update git submodules
git submodule update --init

# Apply quilt patches
quilt push -a

# Install npm dependencies
npm install

# Build vscode version
VERSION=$VERSION npm run build:vscode

# General build
VERSION=$VERSION npm run build

# Create release
npm run release

# Create standalone release
npm run release:standalone

echo "✅ All steps completed successfully."
