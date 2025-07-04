#!/bin/bash
quilt pop -a
# Exit immediately if a command exits with a non-zero status
set -e

# Update git submodules
git submodule update --init

# Apply quilt patches
quilt push -a

# Install npm dependencies
npm install

# Build vscode version
VERSION=0.0.0 npm run build:vscode

# General build
VERSION=1.0.4 npm run build

# Create release
npm run release

# Create standalone release
npm run release:standalone

# Package the project
VERSION=1.0.4 npm run package

echo "✅ All steps completed successfully."
