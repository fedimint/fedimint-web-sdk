#!/bin/sh

set -e 

echo "Building WASM bundle..."
nix build .#wasmBundle

echo "Copying WASM files..."
cp result/share/fedimint-client-wasm/fedimint_* packages/wasm-bundler/
