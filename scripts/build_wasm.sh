#!/bin/sh

set -e 

echo "Building WASM bundle..."
nix build -L .#wasmBundle

echo "Copying WASM files..."
cp result/share/fedimint-client-wasm/fedimint_* packages/wasm-bundler/
cp result/share/fedimint-client-wasm-web/fedimint_* packages/wasm-web/

# Lets future builds replace the existing files
chmod u+w packages/wasm-bundler/fedimint_*
chmod u+w packages/wasm-web/fedimint_*